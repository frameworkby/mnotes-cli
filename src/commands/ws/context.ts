import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
}

export const contextAction: ActionDescriptor<Input, unknown> = {
  name: "context",
  describe: "Workspace overview: folder tree, recent notes, top tags.",
  mcpTool: "get_workspace_context",
  args: (cmd: Command) => cmd,
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getWorkspaceContext(workspaceId);
  },
};
