import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
  content: string;
  workspaceId?: string;
}

export const appendAction: ActionDescriptor<Input, unknown> = {
  name: "append",
  describe: "Append content to the end of an existing note.",
  mcpTool: "append_to_note",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .requiredOption("--content <text>", "Content to append")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.appendToNote(input.id, { workspaceId, content: input.content });
  },
};
