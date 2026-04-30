import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { ListRecipesResult } from "../../client";

interface Input {
  workspaceId?: string;
}

export const listRecipesAction: ActionDescriptor<Input, ListRecipesResult> = {
  name: "list",
  describe:
    "List all prompt recipes for the authenticated user. Returns recipe id, name, and description.",
  mcpTool: "list_recipes",
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
    return client.listRecipes(workspaceId);
  },
};
