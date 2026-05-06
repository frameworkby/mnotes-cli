import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
}

export const archiveAction: ActionDescriptor<Input, unknown> = {
  name: "archive",
  describe: "Archive a note (soft-delete; recoverable).",
  mcpTool: "archive_note",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd.argument("<id>", "Note ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.archiveNote(input.id, workspaceId);
  },
};
