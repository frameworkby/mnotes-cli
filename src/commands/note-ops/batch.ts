import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  ids: string;
  workspaceId?: string;
}

export const batchAction: ActionDescriptor<Input, unknown> = {
  name: "batch",
  describe: "Fetch multiple notes by ID (max 50).",
  mcpTool: "get_notes",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--ids <csv>", "Comma-separated note IDs (max 50)")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const ids = input.ids
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getNotesBatch({ workspaceId, ids });
  },
};
