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
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .arguments("[id]")
      .option("--id <id>", "Note ID (alias for positional)"),

  run: async (input, ctx) => {
    if (!input.id) {
      process.stderr.write("Error: Note ID required — pass as positional or via --id <id>\n");
      process.exit(1);
    }
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);
    const res = await client.getNote(input.id);
    const note = res.data;

    if (isDigestNote({ title: note.title })) {
      void sendTelemetryEvent({
        event: "digest_note_opened",
        props: {
          source: "cli",
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
