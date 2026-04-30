import { Option, type Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { GraphResult } from "../../client";

interface GetInput {
  workspaceId?: string;
  query?: string;
  nodeType?: string;
  limit?: number;
}

export const getGraphAction: ActionDescriptor<GetInput, GraphResult> = {
  name: "get",
  describe:
    "Fetch the knowledge graph for a workspace, optionally filtered by label query and node type.",
  mcpTool: "get_graph",
  args: (cmd: Command) =>
    cmd
      .option("--workspace-id <id>", "Workspace ID")
      .option("--query <q>", "Filter nodes whose label contains this string")
      .addOption(
        new Option("--node-type <t>", "Filter by node type").choices([
          "note",
          "tag",
          "concept",
        ]),
      )
      .option("--limit <n>", "Max nodes (1-200)", (v) => parseInt(v, 10)),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getGraph({
      workspaceId,
      query: input.query,
      nodeType: input.nodeType,
      limit: input.limit,
    });
  },
};
