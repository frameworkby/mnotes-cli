import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { Note } from "../../client";
import { printNote } from "../../output";
import type { ActionDescriptor } from "../_register-group";

interface GetInput {
  id: string;
}

export const getNoteAction: ActionDescriptor<GetInput, Note> = {
  name: "get",
  describe: "Get a note by ID",
  mcpTool: "get_note",
  positional: ["id"],
  args: (cmd: Command) => cmd.argument("<id>", "Note ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);
    const res = await client.getNote(input.id);
    return res.data;
  },

  renderHuman: (output) => {
    printNote(output);
  },
};
