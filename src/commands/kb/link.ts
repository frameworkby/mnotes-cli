import { Option, type Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { KnowledgeLinkResult } from "../../client";

interface LinkInput {
  relationType:
    | "supports"
    | "contradicts"
    | "extends"
    | "replaces"
    | "depends_on"
    | "related";
  sourceKey?: string;
  sourceNoteId?: string;
  targetKey?: string;
  targetNoteId?: string;
  description?: string;
  confidence?: number;
}

export const linkAction: ActionDescriptor<LinkInput, KnowledgeLinkResult> = {
  name: "link",
  describe:
    "Create a typed relationship edge between two knowledge entries (by key or note ID). Useful for declaring supports/contradicts/extends/replaces/depends_on/related links.",
  mcpTool: "knowledge_link",
  args: (cmd: Command) =>
    cmd
      .addOption(
        new Option("--relation-type <t>", "Relationship type")
          .choices([
            "supports",
            "contradicts",
            "extends",
            "replaces",
            "depends_on",
            "related",
          ])
          .makeOptionMandatory(),
      )
      .option("--source-key <k>", "Source entry key")
      .option("--source-note-id <id>", "Source note ID")
      .option("--target-key <k>", "Target entry key")
      .option("--target-note-id <id>", "Target note ID")
      .option("--description <d>", "Optional description of the relationship")
      .option("--confidence <n>", "Confidence 0.0–1.0", (v) => parseFloat(v)),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.knowledgeLink({
      relationType: input.relationType,
      workspaceId,
      sourceKey: input.sourceKey,
      sourceNoteId: input.sourceNoteId,
      targetKey: input.targetKey,
      targetNoteId: input.targetNoteId,
      description: input.description,
      confidence: input.confidence,
    });
  },
};
