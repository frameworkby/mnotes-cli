import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
  type: string;
  workspaceId?: string;
}

export const setTypeAction: ActionDescriptor<Input, unknown> = {
  name: "set-type",
  describe: "Set the object-type for a note (e.g. 'task', 'meeting').",
  mcpTool: "set_note_type",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .requiredOption("--type <s>", "Object type slug (or null to clear)")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.setNoteType(input.id, { workspaceId, type: input.type });
  },
};
