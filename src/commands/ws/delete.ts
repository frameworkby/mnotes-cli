import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
}

export const deleteWsAction: ActionDescriptor<Input, unknown> = {
  name: "delete",
  describe: "Delete a workspace (owner only). Destructive — use with care.",
  positional: ["id"],
  args: (cmd: Command) => cmd.argument("<id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);
    return client.deleteWorkspace(input.id);
  },
};
