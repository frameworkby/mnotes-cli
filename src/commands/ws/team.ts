import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
}

export const teamAction: ActionDescriptor<Input, unknown> = {
  name: "team",
  describe: "List members of a workspace.",
  mcpTool: "list_team_members",
  positional: ["id"],
  args: (cmd: Command) => cmd.argument("<id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);
    return client.listTeamMembers(input.id);
  },
};
