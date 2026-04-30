import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  workspaceId?: string;
}

export const pinnedAction: ActionDescriptor<Input, unknown> = {
  name: "pinned",
  describe: "List pinned notes for the workspace.",
  mcpTool: "list_pinned",
  args: (cmd: Command) => cmd.option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.listPinned(workspaceId);
  },
};
