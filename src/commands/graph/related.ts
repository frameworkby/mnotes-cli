import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { RelatedNote } from "../../client";

interface RelatedInput {
  id: string;
  limit?: number;
  minSimilarity?: number;
}

export const relatedNotesAction: ActionDescriptor<RelatedInput, RelatedNote[]> = {
  name: "related",
  describe:
    "Find notes semantically related to the given note via embedding similarity.",
  mcpTool: "related_notes",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .option("--limit <n>", "Max results (1-50)", (v) => parseInt(v, 10))
      .option("--min-similarity <n>", "Minimum cosine similarity (0-1)", (v) =>
        parseFloat(v),
      ),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.relatedNotes(input.id, {
      workspaceId,
      limit: input.limit,
      minSimilarity: input.minSimilarity,
    });
  },
};
