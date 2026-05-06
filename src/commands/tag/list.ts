import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
}

export const listTagsAction: ActionDescriptor<Input, unknown> = {
  name: "list",
  describe: "List all tags in the workspace with usage counts.",
  mcpTool: "list_tags",
  args: (cmd: Command) => cmd,
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.listTags(workspaceId);
  },
};
