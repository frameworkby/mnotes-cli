import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { BulkOpResult } from "../../client";

interface Input {
  noteIds: string;
  targetFolderId: string;
  workspaceId?: string;
}

export const bulkMoveAction: ActionDescriptor<Input, BulkOpResult> = {
  name: "move",
  describe:
    "Move multiple notes to a target folder. Returns error if the folder does not exist or is not owned by the caller.",
  mcpTool: "bulk_move",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--note-ids <csv>", "Comma-separated note IDs (1-100)")
      .requiredOption("--target-folder-id <id>", "Target folder ID")
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
    return client.bulkMove({
      noteIds,
      targetFolderId: input.targetFolderId,
      workspaceId,
    });
  },
};
