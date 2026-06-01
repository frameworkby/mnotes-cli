import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
  maxLength?: number;
}

export const noteSummaryAction: ActionDescriptor<Input, unknown> = {
  name: "note-summary",
  describe: "AI-generated short summary of a note.",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .option("--max-length <n>", "Max summary chars (50-500, default 150)", (v) =>
        parseInt(v, 10),
      ),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.noteSummary(input.id, {
      workspaceId,
      maxLength: input.maxLength,
    });
  },
};
