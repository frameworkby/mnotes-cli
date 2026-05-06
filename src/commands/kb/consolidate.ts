import { Option, type Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { ConsolidateResult } from "../../client";

interface ConsolidateInput {
  noteIds: string;
  targetTitle: string;
  strategy: "merge" | "summarize";
}

export const consolidateAction: ActionDescriptor<ConsolidateInput, ConsolidateResult> = {
  name: "consolidate",
  describe:
    "Consolidate multiple knowledge notes into a single target note via merge or summarize strategy. Source notes are archived after consolidation.",
  mcpTool: "consolidate_memories",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--note-ids <csv>", "Comma-separated note IDs to consolidate")
      .requiredOption("--target-title <s>", "Title for the consolidated note")
      .addOption(
        new Option("--strategy <s>", "Consolidation strategy")
          .choices(["merge", "summarize"])
          .makeOptionMandatory(),
      ),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const noteIds = input.noteIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (noteIds.length === 0) {
      throw new Error("--note-ids must contain at least one ID");
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.consolidateMemories({
      noteIds,
      targetTitle: input.targetTitle,
      strategy: input.strategy,
      workspaceId,
    });
  },
};
