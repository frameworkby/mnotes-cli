import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { DeleteGraphEntityResult } from "../../client";

interface DeleteEdgeInput {
  id: string;
  workspaceId?: string;
}

export const deleteEdgeAction: ActionDescriptor<DeleteEdgeInput, DeleteGraphEntityResult> = {
  name: "delete-edge",
  describe: "Delete a graph edge by ID.",
  mcpTool: "delete_edge",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd.argument("<id>", "Edge ID").option("--workspace-id <id>", "Workspace ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.deleteGraphEdge(input.id, workspaceId);
  },
};
