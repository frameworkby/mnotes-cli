import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { DeleteGraphEntityResult } from "../../client";

interface DeleteBuildInput {
  id: string;
}

export const deleteBuildAction: ActionDescriptor<DeleteBuildInput, DeleteGraphEntityResult> = {
  name: "delete-build",
  describe: "Delete a graph build (and all its nodes and edges) by ID.",
  mcpTool: "delete_graph_build",
  positional: ["id"],
  args: (cmd: Command) => cmd.argument("<id>", "Build ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.deleteGraphBuild(input.id, workspaceId);
  },

  renderHuman: (out) => console.log(`Deleted build ${out.id}`),
};
