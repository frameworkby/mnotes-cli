import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { ArchiveStaleResult } from "../../client";

interface ArchiveInput {
  workspaceId?: string;
  maxDecayScore?: number;
  maxImportance?: number;
  dryRun?: boolean;
}

export const archiveAction: ActionDescriptor<ArchiveInput, ArchiveStaleResult> = {
  name: "archive",
  describe:
    "Archive stale knowledge entries based on decay score and importance thresholds. Use --dry-run to preview which entries would be archived without making changes.",
  mcpTool: "archive_stale_memories",
  args: (cmd: Command) =>
    cmd
      .option("--workspace-id <id>", "Workspace ID")
      .option("--max-decay-score <n>", "Only archive entries with decay score above this", (v) =>
        parseFloat(v),
      )
      .option("--max-importance <n>", "Only archive entries below this importance", (v) =>
        parseFloat(v),
      )
      .option("--dry-run", "Preview without writing"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.archiveStaleMemories({
      workspaceId,
      maxDecayScore: input.maxDecayScore,
      maxImportance: input.maxImportance,
      dryRun: input.dryRun,
    });
  },
};
