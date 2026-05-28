import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SuggestionsResult } from "../../client";

interface Input {
  id: string;
}

export const suggestTagsLinksAction: ActionDescriptor<Input, SuggestionsResult> = {
  name: "suggest-tags-links",
  describe:
    "Get AI-powered tag and wikilink suggestions for a note based on semantic similarity. Uses the note's existing embedding to find similar notes (score >= 0.75).",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.suggestTagsLinks(input.id, workspaceId);
  },
};
