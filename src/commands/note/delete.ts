import type { Command } from "commander";
import * as readline from "readline";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import { printSuccess } from "../../output";
import type { ActionDescriptor } from "../_register-group";

function confirm(message: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    process.stderr.write(
      "Error: Use --force to confirm deletion in non-interactive mode.\n",
    );
    process.exit(1);
  }

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });
    rl.question(`${message} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

interface DeleteInput {
  id: string;
  force?: boolean;
}

interface DeleteOutput {
  id: string;
}

export const deleteNoteAction: ActionDescriptor<DeleteInput, DeleteOutput> = {
  name: "delete",
  describe: "Delete a note",
  mcpTool: "delete_note",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .arguments("[id]")
      .option("--id <id>", "Note ID (alias for positional)")
      .option("--force", "Skip confirmation prompt"),

  run: async (input, ctx) => {
    if (!input.id) {
      process.stderr.write("Error: Note ID required — pass as positional or via --id <id>\n");
      process.exit(1);
    }
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);

    if (!input.force && !ctx.json) {
      const ok = await confirm(`Delete note ${input.id}?`);
      if (!ok) {
        process.stderr.write("Aborted.\n");
        process.exit(0);
      }
    }

    const res = await client.deleteNote(input.id);
    return res.data;
  },

  renderHuman: (output) => {
    printSuccess(`Deleted note ${output.id}`);
  },
};
