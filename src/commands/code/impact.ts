import { resolve } from "node:path";
import type { Command } from "commander";
import type { ActionDescriptor } from "../_register-group";
import type { CodeImpactResult } from "../../client";
import {
  BUILD_OPTION,
  buildSummary,
  codeEnv,
  isFile,
  isNotFound,
  loc,
  positiveInt,
  requireBuild,
  toRepoRelative,
} from "./shared";

export interface CodeImpactInput {
  target: string;
  depth?: number;
  limit?: number;
  build?: string;
}

export type CodeImpactOutput = CodeImpactResult & {
  build: { id: string; name: string; commitSha: string | null };
  /** "file" when the argument was a file on disk, "search" when resolved via the top search hit. */
  matchedBy: "file" | "search";
  query: string;
  /** True when the file isn't in the build (new file, or the graph is stale). Not an error. */
  notInGraph?: boolean;
};

export const codeImpactAction: ActionDescriptor<CodeImpactInput, CodeImpactOutput> = {
  name: "impact",
  describe: "List what depends on a file or symbol (reverse dependencies), grouped by file.",
  mcpTool: "get_code_graph_impact",
  positional: ["target"],
  args: (cmd: Command) =>
    cmd
      .argument("<file-path|symbol>", "A file on disk, or a symbol name (top search hit is used)")
      .option("--depth <n>", "How many hops to walk, 1-4 (default 2)", positiveInt)
      .option("--limit <n>", "Max dependents, 1-300 (default 100)", positiveInt)
      .option(...BUILD_OPTION),

  run: async (input, ctx) => {
    const env = codeEnv(ctx);
    const build = await requireBuild(env, input.build);
    const opts = {
      ...(input.depth ? { depth: input.depth } : {}),
      ...(input.limit ? { limit: input.limit } : {}),
    };

    if (isFile(resolve(env.cwd, input.target))) {
      const root = env.repoRoot ?? env.cwd;
      const file = toRepoRelative(input.target, root, env.cwd);
      if (file === null) {
        throw new Error(`${input.target} is outside the repo (${root}).`);
      }
      const base = { build: buildSummary(build), matchedBy: "file" as const, query: input.target };
      try {
        const res = await env.client.getGraphBuildImpact(build.id, env.workspaceId, { file, ...opts });
        return { ...base, ...res };
      } catch (err) {
        if (!isNotFound(err)) throw err;
        return { ...base, target: { file }, dependents: [], files: [], truncated: false, notInGraph: true };
      }
    }

    const { nodes } = await env.client.searchGraphBuild(build.id, env.workspaceId, { q: input.target, limit: 1 });
    if (nodes.length === 0) {
      throw new Error(`"${input.target}" is not a file and matches no symbol in build "${build.name}".`);
    }
    const res = await env.client.getGraphBuildImpact(build.id, env.workspaceId, { node: nodes[0].id, ...opts });
    return { build: buildSummary(build), matchedBy: "search", query: input.target, ...res };
  },

  renderHuman: (out) => {
    const node = out.target.node;
    const target = out.target.file ?? (node ? `${node.label}${loc(node) ? ` (${loc(node)})` : ""}` : out.query);
    if (out.notInGraph) {
      console.log(`${target} is not in the graph yet (new file, or the build is stale; see \`mnotes code status\`). No known dependents.`);
      return;
    }
    if (out.matchedBy === "search") {
      console.log(`"${out.query}" is not a file; using the top search hit ${target}.`);
    }
    if (out.dependents.length === 0) {
      console.log(`Nothing in the graph depends on ${target}.`);
      return;
    }
    console.log(`${out.dependents.length} dependent(s) of ${target} in ${out.files.length} file(s):`);
    console.log("  dist  count  file");
    for (const f of out.files) {
      console.log(`  ${String(f.minDistance).padStart(4)}  ${String(f.count).padStart(5)}  ${f.sourceFile}`);
    }
    if (out.truncated) console.log("(Truncated; raise --limit or lower --depth.)");
  },
};
