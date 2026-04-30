import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
  workspaceId?: string;
}

export const pinAction: ActionDescriptor<Input, unknown> = {
  name: "pin",
  describe: "Pin a note (max 10 per workspace).",
  mcpTool: "pin_note",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd.argument("<id>", "Note ID").option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.pinNote(input.id, workspaceId);
  },
};
