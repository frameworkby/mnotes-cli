import type { Command } from "commander";
import type { ActionDescriptor } from "../_register-group";
import type { CodeEdge, CodeNodeDetail } from "../../client";
import { BUILD_OPTION, buildSummary, codeEnv, isNotFound, loc, positiveInt, requireBuild } from "./shared";

export interface CodeShowInput {
  target: string;
  limit?: number;
  build?: string;
}

export type CodeShowResult = CodeNodeDetail & {
  build: { id: string; name: string; commitSha: string | null };
  /** "id" when the argument was a node id, "search" when it was resolved via the top search hit. */
  matchedBy: "id" | "search";
  query: string;
};

function groupByType(edges: CodeEdge[]): Map<string, CodeEdge[]> {
  const groups = new Map<string, CodeEdge[]>();
  for (const e of edges) {
    const list = groups.get(e.edgeType) ?? [];
    list.push(e);
    groups.set(e.edgeType, list);
  }
  return groups;
}

function printEdges(title: string, edges: CodeEdge[]): void {
  if (edges.length === 0) return;
  console.log("");
  console.log(title);
  for (const [type, list] of groupByType(edges)) {
    console.log(`  ${type} (${list.length}):`);
    for (const e of list) {
      const where = loc(e.other);
      console.log(`    ${e.other.label}${where ? `  ${where}` : ""}  id=${e.other.id}`);
    }
  }
}

export const codeShowAction: ActionDescriptor<CodeShowInput, CodeShowResult> = {
  name: "show",
  describe: "Show a code node: location, snippet, callers, callees/imports and linked notes.",
  mcpTool: "get_code_graph_node",
  positional: ["target"],
  args: (cmd: Command) =>
    cmd
      .argument("<node-id|query>", "Node id, or a query whose top search hit is shown")
      .option("--limit <n>", "Max edges per direction, 1-200 (default 50)", positiveInt)
      .option(...BUILD_OPTION),

  run: async (input, ctx) => {
    const env = codeEnv(ctx);
    const build = await requireBuild(env, input.build);
    const opts = input.limit ? { limit: input.limit } : {};
    try {
      const detail = await env.client.getGraphBuildNode(build.id, input.target, env.workspaceId, opts);
      return { build: buildSummary(build), matchedBy: "id", query: input.target, ...detail };
    } catch (err) {
      if (!isNotFound(err)) throw err;
    }
    const { nodes } = await env.client.searchGraphBuild(build.id, env.workspaceId, { q: input.target, limit: 1 });
    if (nodes.length === 0) {
      throw new Error(`No node with id "${input.target}" and no search match in build "${build.name}".`);
    }
    const detail = await env.client.getGraphBuildNode(build.id, nodes[0].id, env.workspaceId, opts);
    return { build: buildSummary(build), matchedBy: "search", query: input.target, ...detail };
  },

  renderHuman: (out) => {
    const n = out.node;
    if (out.matchedBy === "search") {
      console.log(`"${out.query}" is not a node id; showing the top search hit.`);
      console.log("");
    }
    console.log(`${n.label}  [${n.nodeType}]  id=${n.id}`);
    const where = loc(n);
    if (where) console.log(`  ${where}`);
    if (n.communityName || n.community != null) {
      console.log(`  community: ${n.communityName ?? n.community}`);
    }
    if (n.snippet) {
      console.log("");
      const start = n.snippetStartLine ?? 1;
      const lines = n.snippet.split("\n");
      const width = String(start + lines.length - 1).length;
      lines.forEach((l, i) => console.log(`  ${String(start + i).padStart(width)} | ${l}`));
    }
    printEdges("Incoming (callers / dependents):", out.incoming);
    printEdges("Outgoing (callees / imports):", out.outgoing);
    if (out.notes.length > 0) {
      console.log("");
      console.log("Linked notes:");
      for (const note of out.notes) console.log(`  ${note.label} [${note.type}]  ${note.noteId}`);
    }
    if (out.truncated) {
      console.log("");
      console.log("(Edges truncated; raise --limit to see more.)");
    }
  },
};
