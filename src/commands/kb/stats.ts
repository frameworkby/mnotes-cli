import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { KbStats } from "../../client";

interface StatsInput {
}

export const statsAction: ActionDescriptor<StatsInput, KbStats> = {
  name: "stats",
  describe:
    "Get knowledge base statistics: total notes, total tags, orphan count, stale count, conflict count, and embedding coverage.",
  mcpTool: "get_kb_stats",
  args: (cmd: Command) => cmd,

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getKbStats(workspaceId);
  },
};
