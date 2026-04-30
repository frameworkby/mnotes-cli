import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { PopulateGraphResult } from "../../client";

interface PopulateInput {
  workspaceId?: string;
}

export const populateGraphAction: ActionDescriptor<PopulateInput, PopulateGraphResult> = {
  name: "populate",
  describe:
    "Populate the graph for a workspace by syncing nodes and edges from notes/wikilinks.",
  mcpTool: "populate_graph",
  args: (cmd: Command) => cmd.option("--workspace-id <id>", "Workspace ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.populateGraph({ workspaceId });
  },
};
