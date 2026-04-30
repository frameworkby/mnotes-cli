import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  daysSince?: number;
  limit?: number;
  workspaceId?: string;
}

export const staleAction: ActionDescriptor<Input, unknown> = {
  name: "stale",
  describe: "List notes not updated in N days (default 30).",
  mcpTool: "stale_notes",
  args: (cmd: Command) =>
    cmd
      .option("--days-since <n>", "Days since last update (1-365)", (v) =>
        parseInt(v, 10),
      )
      .option("--limit <n>", "Max results (1-200)", (v) => parseInt(v, 10))
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.staleNotes({
      workspaceId,
      daysSince: input.daysSince,
      limit: input.limit,
    });
  },
};
