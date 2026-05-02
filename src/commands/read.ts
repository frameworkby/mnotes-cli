import { Command } from "commander";
import { resolveConfig } from "../config";
import { createClient } from "../client";
import { printJson, printNote } from "../output";
import {
  sendTelemetryEvent,
  isDigestNote,
  bucketAgeHours,
  nextDigestSessionIndex,
} from "../lib/telemetry";

export function registerReadCommand(program: Command): void {
  program
    .command("read <id>")
    .description("Read a note by ID")
    .action(async (id: string) => {
      const globalOpts = program.opts();
      const config = resolveConfig(globalOpts);
      const client = createClient(config.baseUrl, config.apiKey);

      const result = await client.getNote(id);

      if (globalOpts.json) {
        printJson(result.data);
      } else {
        printNote(result.data);
      }

      const note = result.data;
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
    });
}
