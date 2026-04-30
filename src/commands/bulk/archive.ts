import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { BulkOpResult } from "../../client";

interface Input {
  noteIds: string;
  workspaceId?: string;
}

export const bulkArchiveAction: ActionDescriptor<Input, BulkOpResult> = {
  name: "archive",
  describe:
    "Archive multiple notes, removing them from default note listings without deleting them. Already-archived notes are silently skipped.",
  mcpTool: "bulk_archive",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--note-ids <csv>", "Comma-separated note IDs (1-100)")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const noteIds = input.noteIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (noteIds.length === 0) {
      throw new Error("--note-ids must include at least one ID");
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.bulkArchive({ noteIds, workspaceId });
  },
};
