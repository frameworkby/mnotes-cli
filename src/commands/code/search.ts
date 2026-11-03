import type { Command } from "commander";
import type { ActionDescriptor } from "../_register-group";
import type { CodeSearchHit } from "../../client";
import { BUILD_OPTION, buildSummary, codeEnv, loc, positiveInt, requireBuild } from "./shared";

export interface CodeSearchInput {
  query: string;
  type?: string;
  limit?: number;
  build?: string;
}

export interface CodeSearchResult {
  build: { id: string; name: string; commitSha: string | null };
  nodes: CodeSearchHit[];
}

export const codeSearchAction: ActionDescriptor<CodeSearchInput, CodeSearchResult> = {
  name: "search",
  describe: "Find symbols and files in the code graph by name or path.",
  mcpTool: "search_code_graph",
  positional: ["query"],
  args: (cmd: Command) =>
    cmd
      .argument("<query>", "Symbol name or path fragment")
      .option("--type <type>", "Only nodes of this type (file, function, class, ...)")
      .option("--limit <n>", "Max results, 1-100 (default 20)", positiveInt)
      .option(...BUILD_OPTION),

  run: async (input, ctx) => {
    const env = codeEnv(ctx);
    const build = await requireBuild(env, input.build);
    const { nodes } = await env.client.searchGraphBuild(build.id, env.workspaceId, {
      q: input.query,
      ...(input.type ? { type: input.type } : {}),
      ...(input.limit ? { limit: input.limit } : {}),
    });
    return { build: buildSummary(build), nodes };
  },

  renderHuman: ({ nodes }, input) => {
    if (nodes.length === 0) {
      console.log(`No matches for "${input?.query ?? ""}".`);
      return;
    }
    for (const n of nodes) {
      console.log(`${n.label}  [${n.nodeType}]  ${loc(n)}  degree ${n.degree}  id=${n.id}`);
    }
  },
};
