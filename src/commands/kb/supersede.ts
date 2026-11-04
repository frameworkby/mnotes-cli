import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SupersedeResult } from "../../client";

interface SupersedeInput {
  key?: string;
  id?: string;
  by?: string;
  byId?: string;
  clear?: boolean;
}

export const supersedeAction: ActionDescriptor<SupersedeInput, SupersedeResult> = {
  name: "supersede",
  describe:
    "Mark a knowledge entry as superseded by a newer one, so recall and ask skip it.\n\n" +
    "  mnotes kb supersede --key db.engine --by db.engine.v2\n" +
    "  mnotes kb supersede --key db.engine --clear   # restore it",
  mcpTool: "supersede_knowledge",
  args: (cmd: Command) =>
    cmd
      .option("--key <key>", "Key of the stale entry")
      .option("--id <noteId>", "Note ID of the stale entry")
      .option("--by <key>", "Key of the replacement entry")
      .option("--by-id <noteId>", "Note ID of the replacement entry")
      .option("--clear", "Clear the superseded state (restore the entry)"),

  run: async (input, ctx) => {
    if (!input.key === !input.id) {
      throw new Error("Provide exactly one of --key or --id.");
    }
    const hasBy = Boolean(input.by) || Boolean(input.byId);
    if (input.clear && hasBy) {
      throw new Error("--clear cannot be combined with --by or --by-id.");
    }
    if (!input.clear && !input.by === !input.byId) {
      throw new Error("Provide exactly one of --by or --by-id, or use --clear.");
    }

    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    const res = await client.supersedeKnowledge({
      workspaceId,
      key: input.key,
      noteId: input.id,
      byKey: input.by,
      byNoteId: input.byId,
      clear: input.clear || undefined,
    });
    return res.data;
  },
};
