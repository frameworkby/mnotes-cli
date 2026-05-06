import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface SummaryInput {
}

export const folderSummaryAction: ActionDescriptor<SummaryInput, unknown> = {
  name: "summary",
  // Mirrored verbatim from MCP `get_workspace_summary` description.
  describe:
    "Get a high-level workspace overview: total notes and folders, nested folder tree with note counts, recent activity (last 5 modified notes), top 20 tags by usage, and note counts per type. Useful for AI agent orientation in an unfamiliar workspace.",
  mcpTool: "get_workspace_summary",
  args: (cmd: Command) => cmd,
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getWorkspaceSummary(workspaceId);
  },
};
