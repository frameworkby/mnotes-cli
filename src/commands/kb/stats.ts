import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { KbStats } from "../../client";

interface StatsInput {
  showMissing?: boolean;
}

export const statsAction: ActionDescriptor<StatsInput, KbStats> = {
  name: "stats",
  describe:
    "Get knowledge base statistics: total notes, total tags, orphan count, stale count, conflict count, and embedding coverage.",
  args: (cmd: Command) =>
    cmd.option(
      "--show-missing",
      "List KB keys with NULL embeddings after the summary",
    ),

  run: async (_input, ctx) => {
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

  renderHuman(output, input) {
    const missing = output.missingEmbeddingKeys.length;
    const coverage = output.embeddingCoverage.toFixed(1);
    console.log(
      `KB stats: ${output.totalNotes} notes | ${output.totalTags} tags | ` +
        `${output.orphanCount} orphans | ${output.staleCount} stale | ` +
        `${output.conflictCount} conflicts | embedding coverage ${coverage}% ` +
        `(${missing} missing)`,
    );

    if (input?.showMissing && missing > 0) {
      console.log("Missing embeddings:");
      for (const key of output.missingEmbeddingKeys) {
        console.log(`  ${key}`);
      }
    }
  },
};
