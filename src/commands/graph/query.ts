import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { GraphResult } from "../../client";

interface QueryInput {
  nodeType?: string;
  labelContains?: string;
  edgeType?: string;
  connectedTo?: string;
  depth?: number;
  limit?: number;
}

export const queryGraphAction: ActionDescriptor<QueryInput, GraphResult> = {
  name: "query",
  describe:
    "Advanced graph query: filter nodes by type/label, edges by type, or expand from a connected node.",
  mcpTool: "query_graph",
  args: (cmd: Command) =>
    cmd
      .option("--node-type <t>", "Filter by node type")
      .option("--label-contains <s>", "Filter by label substring")
      .option("--edge-type <t>", "Filter by edge type")
      .option("--connected-to <id>", "Expand from this node ID")
      .option("--depth <n>", "Expansion depth (1-3)", (v) => parseInt(v, 10))
      .option("--limit <n>", "Max nodes (1-200)", (v) => parseInt(v, 10)),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.queryGraphAdvanced({
      nodeType: input.nodeType,
      labelContains: input.labelContains,
      edgeType: input.edgeType,
      connectedTo: input.connectedTo,
      depth: input.depth,
      limit: input.limit,
      workspaceId,
    });
  },
};
