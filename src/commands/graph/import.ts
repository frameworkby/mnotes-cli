import { readFileSync, statSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { GraphBuildRecord } from "../../client";

const MAX_BYTES = 30_000_000; // matches the server's MAX_REQUEST_BYTES

interface ImportInput {
  file: string;
  name?: string;
  root?: string;
  commit?: string;
  replace?: boolean;
  /** Set by run() for renderHuman; never sent to the server. */
  _baseUrl?: string;
}

type ImportResult = GraphBuildRecord & { replaced: boolean };

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
      .option("--root <path>", "Repository root the graph was extracted from")
      .option("--commit <sha>", "Commit SHA the graph was extracted at")
      .option("--replace", "Replace an existing build with the same name"),

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
