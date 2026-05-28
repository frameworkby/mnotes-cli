import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { ListRecipesResult } from "../../client";

interface Input {
}

export const listRecipesAction: ActionDescriptor<Input, ListRecipesResult> = {
  name: "list",
  describe:
    "List all prompt recipes for the authenticated user. Returns recipe id, name, and description.",
  args: (cmd: Command) => cmd,
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.listRecipes(workspaceId);
  },
};
