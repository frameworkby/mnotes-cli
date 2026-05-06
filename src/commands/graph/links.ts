import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { NoteLinksResult } from "../../client";

interface LinksInput {
  id: string;
}

export const noteLinksAction: ActionDescriptor<LinksInput, NoteLinksResult> = {
  name: "links",
  describe:
    "List a note's outgoing wikilinks and incoming backlinks (resolved to existing notes).",
  mcpTool: "get_note_links",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd.argument("<id>", "Note ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getNoteLinks(input.id, workspaceId);
  },
};
