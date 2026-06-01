import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
  type: string;
}

export const setTypeAction: ActionDescriptor<Input, unknown> = {
  name: "set-type",
  describe: "Set the object-type for a note (e.g. 'task', 'meeting').",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .requiredOption("--type <s>", "Object type slug (or null to clear)"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.setNoteType(input.id, { workspaceId, type: input.type });
  },
};
