import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  workspaceId?: string;
}

export const listTagsAction: ActionDescriptor<Input, unknown> = {
  name: "list",
  describe: "List all tags in the workspace with usage counts.",
  mcpTool: "list_tags",
  args: (cmd: Command) => cmd.option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.listTags(workspaceId);
  },
};
