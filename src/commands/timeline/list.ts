import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { TimelineEntry } from "../../client";

interface TimelineListInput {
  workspaceId?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export const listTimelineAction: ActionDescriptor<
  TimelineListInput,
  TimelineEntry[]
> = {
  name: "list",
  describe:
    "List notes by creation date (newest first). Optionally filter by ISO date range and limit (max 200, default 100).",
  mcpTool: "list_timeline",
  args: (cmd: Command) =>
    cmd
      .option("--workspace-id <id>", "Workspace ID")
      .option("--from <iso>", "Lower bound ISO datetime (inclusive)")
      .option("--to <iso>", "Upper bound ISO datetime (inclusive)")
      .option("--limit <n>", "Max results (1-200, default 100)", (v) =>
        parseInt(v, 10),
      ),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.listTimeline({
      workspaceId,
      from: input.from,
      to: input.to,
      limit: input.limit,
    });
  },
};
