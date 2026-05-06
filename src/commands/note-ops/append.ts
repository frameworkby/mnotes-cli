import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
  content: string;
}

export const appendAction: ActionDescriptor<Input, unknown> = {
  name: "append",
  describe: "Append content to the end of an existing note.",
  mcpTool: "append_to_note",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .requiredOption("--content <text>", "Content to append"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.appendToNote(input.id, { workspaceId, content: input.content });
  },
};
