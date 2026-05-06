import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { DeleteGraphEntityResult } from "../../client";

interface DeleteNodeInput {
  id: string;
}

export const deleteNodeAction: ActionDescriptor<DeleteNodeInput, DeleteGraphEntityResult> = {
  name: "delete-node",
  describe: "Delete a graph node by ID. Cascades to its edges.",
  mcpTool: "delete_node",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd.argument("<id>", "Node ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.deleteGraphNode(input.id, workspaceId);
  },
};
