import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { KnowledgeStoreResult } from "../../client";

interface StoreInput {
  key: string;
  content: string;
  source?: string;
  confidence?: number;
  tags?: string;
}

export const storeAction: ActionDescriptor<StoreInput, KnowledgeStoreResult> = {
  name: "store",
  describe:
    "Store a structured knowledge entry (fact, decision, or context) that persists across sessions. Creates a new entry when the key is new, or updates the existing entry when the key already exists for the user+workspace. Knowledge entries are searchable via search_notes but hidden from the UI sidebar.",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--key <key>", "Unique identifier for this entry")
      .requiredOption("--content <md>", "Markdown content of the entry")
      .option("--source <s>", "Origin (e.g. user-stated, inferred)")
      .option("--confidence <n>", "Confidence 0.0–1.0", (v) => parseFloat(v))
      .option("--tags <csv>", "Comma-separated tags"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const tags = input.tags
      ? input.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : undefined;
    const client = createClient(config.baseUrl, config.apiKey);
    return client.knowledgeStore({
      key: input.key,
      content: input.content,
      workspaceId,
      source: input.source,
      confidence: input.confidence,
      tags,
    });
  },
};
