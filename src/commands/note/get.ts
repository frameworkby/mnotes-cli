import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { Note } from "../../client";
import { printNote } from "../../output";
import type { ActionDescriptor } from "../_register-group";
import {
  sendTelemetryEvent,
  isDigestNote,
  bucketAgeHours,
  nextDigestSessionIndex,
} from "../../lib/telemetry";

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
    const note = res.data;

    if (isDigestNote({ title: note.title })) {
      void sendTelemetryEvent({
        event: "digest_note_opened",
        props: {
          source: "mcp",
          age_hours: bucketAgeHours(note.createdAt),
          session_index: nextDigestSessionIndex(),
        },
      });
    }

    return note;
  },

  renderHuman: (output) => {
    printNote(output);
  },
};
