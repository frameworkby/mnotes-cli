import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
}

export const roleAction: ActionDescriptor<Input, unknown> = {
  name: "role",
  describe: "Show the caller's role and capabilities for a workspace.",
  mcpTool: "get_workspace_role",
  positional: ["id"],
  args: (cmd: Command) => cmd.argument("<id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getWorkspaceRole(input.id);
  },
};
