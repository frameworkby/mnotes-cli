import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  date?: string;
  workspaceId?: string;
}

export const dailyDigestAction: ActionDescriptor<Input, unknown> = {
  name: "daily-digest",
  describe: "Summary of notes touched on a date (default: today).",
  mcpTool: "daily_digest",
  args: (cmd: Command) =>
    cmd
      .option("--date <s>", "ISO date YYYY-MM-DD (default: today)")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.dailyDigest({ workspaceId, date: input.date });
  },
};
