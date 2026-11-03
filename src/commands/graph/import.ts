import { readFileSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { GraphBuildRecord } from "../../client";

const MAX_BYTES = 30_000_000; // matches the server's MAX_REQUEST_BYTES
const SNIPPET_LINES = 20;
const SNIPPET_CHARS = 1500; // server keeps ≤ 2000
const SNIPPET_FILE_BYTES = 1_000_000;
const SNIPPET_BUDGET = 8_000_000; // JSON-encoded chars across all snippets

interface ImportInput {
  file: string;
  name?: string;
  root?: string;
  commit?: string;
  replace?: boolean;
  /** Commander sets false for --no-snippets. */
  snippets?: boolean;
  /** Set by run() for renderHuman; never sent to the server. */
  _baseUrl?: string;
}

type ImportResult = GraphBuildRecord & { replaced: boolean };

interface SnippetNode {
  label?: unknown;
  type?: unknown;
  file_type?: unknown;
  source_file?: unknown;
  source_location?: unknown;
  _callable?: unknown;
  _callable_class?: unknown;
  snippet?: string;
  [key: string]: unknown;
}

// Mirrors the app's nodeTypeOf: only module / class / function / symbol nodes get code.
function isCodeNode(n: SnippetNode): boolean {
  if (n.type === "external") return false;
  if (n.type === "module" || n._callable_class || n._callable) return true;
  if (typeof n.source_file === "string" && typeof n.label === "string" && n.source_file.endsWith(n.label)) return false;
  return n.file_type === "code";
}

/**
 * Attach `snippet` (≤ 20 lines / 1500 chars from the node's start line) to code nodes, in place.
 * Skips missing, binary (NUL), > 1 MB and out-of-root files. Stops once `budget` JSON chars are used.
 */
export function attachSnippets(
  nodes: SnippetNode[],
  root: string,
  budget = SNIPPET_BUDGET,
): { attached: number; overBudget: number } {
  let realRoot: string;
  try {
    realRoot = realpathSync(root);
  } catch {
    return { attached: 0, overBudget: 0 };
  }
  const files = new Map<string, string[] | null>();
  const linesOf = (rel: string): string[] | null => {
    if (files.has(rel)) return files.get(rel)!;
    let out: string[] | null = null;
    try {
      const abs = realpathSync(resolve(realRoot, rel)); // resolves symlinks before the guard
      const r = relative(realRoot, abs);
      if (r && !r.startsWith("..") && !isAbsolute(r) && statSync(abs).size <= SNIPPET_FILE_BYTES) {
        const buf = readFileSync(abs);
        if (!buf.includes(0)) out = buf.toString("utf8").split(/\r?\n/);
      }
    } catch {
      // missing / unreadable: no snippet
    }
    files.set(rel, out);
    return out;
  };

  let used = 0;
  let attached = 0;
  let overBudget = 0;
  for (const n of nodes) {
    if (!isCodeNode(n) || typeof n.source_file !== "string" || !n.source_file) continue;
    const m = /^L(\d+)(?:-L?(\d+))?/.exec(typeof n.source_location === "string" ? n.source_location : "");
    if (!m) continue;
    const start = Number(m[1]);
    const end = Math.min(m[2] ? Number(m[2]) : Infinity, start + SNIPPET_LINES - 1);
    const lines = linesOf(n.source_file);
    if (!lines || start < 1 || start > lines.length) continue;
    const snippet = lines.slice(start - 1, end).join("\n").slice(0, SNIPPET_CHARS);
    const cost = JSON.stringify(snippet).length;
    if (used + cost > budget) {
      overBudget++;
      continue;
    }
    used += cost;
    n.snippet = snippet;
    attached++;
  }
  return { attached, overBudget };
}

function deriveName(input: ImportInput): string {
  if (input.name) return input.name;
  if (input.root) return basename(resolve(input.root));
  const dir = dirname(resolve(input.file));
  if (basename(dir) === "graphify-out") return basename(dirname(dir));
  return basename(process.cwd());
}

export const importGraphAction: ActionDescriptor<ImportInput, ImportResult> = {
  name: "import",
  describe: "Import a graphify graph.json as a graph build.",
  mcpTool: "import_graph_build",
  positional: ["file"],
  args: (cmd: Command) =>
    cmd
      .argument("<file>", "Path to graphify graph.json")
      .option("--name <name>", "Build name (unique per workspace)")
      .option("--root <path>", "Repository root the graph was extracted from; code snippets are read from here")
      .option("--commit <sha>", "Commit SHA the graph was extracted at")
      .option("--replace", "Replace an existing build with the same name")
      .option("--no-snippets", "Don't attach code snippets read from --root"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }

    let size: number;
    try {
      size = statSync(input.file).size;
    } catch {
      throw new Error(`File not found: ${input.file}`);
    }
    if (size > MAX_BYTES) {
      const mb = (size / 1_000_000).toFixed(1);
      throw new Error(
        `${input.file} is ${mb} MB; the import limit is 30 MB. Re-run graphify with --exclude to shrink it.`,
      );
    }

    let graph: unknown;
    try {
      graph = JSON.parse(readFileSync(input.file, "utf8"));
    } catch {
      throw new Error(`Not valid JSON: ${input.file}`);
    }
    const g = graph as { nodes?: unknown; links?: unknown; graph?: { graphify_version?: unknown } } | null;
    if (!g || !Array.isArray(g.nodes) || !Array.isArray(g.links)) {
      throw new Error("Not a graphify graph.json (expected nodes[] and links[])");
    }
    const version = g.graph?.graphify_version;

    if (input.root && input.snippets !== false) {
      // Keep the whole request under the server limit even when graph.json itself is large.
      const budget = Math.min(SNIPPET_BUDGET, MAX_BYTES - size - 1_000_000);
      const { attached, overBudget } = attachSnippets(g.nodes as SnippetNode[], input.root, budget);
      if (overBudget > 0) {
        process.stderr.write(
          `Snippet budget reached: attached ${attached} code snippets, skipped ${overBudget}.\n`,
        );
      }
    }

    input._baseUrl = config.baseUrl;
    const client = createClient(config.baseUrl, config.apiKey);
    return client.importGraphBuild({
      workspaceId,
      name: deriveName(input),
      ...(input.root ? { rootPath: input.root } : {}),
      ...(input.commit ? { commitSha: input.commit } : {}),
      ...(typeof version === "string" ? { toolVersion: version } : {}),
      ...(input.replace ? { replace: true } : {}),
      graph,
    });
  },

  renderHuman: (out, input) => {
    const s = out.stats;
    if (out.replaced) console.log("Replaced existing build.");
    console.log(
      `Imported "${out.name}": ${s.nodes} nodes, ${s.edges} edges, ${s.communities} communities (${s.droppedLinks} links dropped) → ${input?._baseUrl ?? ""}${out.url}`,
    );
    console.log("(Build viewer page ships in Phase 2.)");
  },
};
