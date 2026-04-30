import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SuggestionsResult } from "../../client";

interface Input {
  id: string;
  workspaceId?: string;
}

export const suggestTagsLinksAction: ActionDescriptor<Input, SuggestionsResult> = {
  name: "suggest-tags-links",
  describe:
    "Get AI-powered tag and wikilink suggestions for a note based on semantic similarity. Uses the note's existing embedding to find similar notes (score >= 0.75).",
  mcpTool: "suggest_tags_links",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.suggestTagsLinks(input.id, workspaceId);
  },
};
