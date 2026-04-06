import { Command } from "commander";
import * as readline from "readline";
import { resolveConfig } from "../config";
import { createClient } from "../client";
import { printJson, printSuccess } from "../output";

function confirm(message: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    process.stderr.write(
      "Error: Use --yes to confirm deletion in non-interactive mode.\n"
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

export function registerDeleteCommand(program: Command): void {
  program
    .command("delete <id>")
    .description("Delete a note")
    .option("--yes", "Skip confirmation prompt")
    .action(async (id: string, opts: Record<string, boolean | undefined>) => {
      const globalOpts = program.opts();
      const config = resolveConfig(globalOpts);
      const client = createClient(config.baseUrl, config.apiKey);

      if (!opts.yes) {
        const ok = await confirm(`Delete note ${id}?`);
        if (!ok) {
          process.stderr.write("Aborted.\n");
          process.exit(0);
        }
      }

      const result = await client.deleteNote(id);

      if (globalOpts.json) {
        printJson(result.data);
      } else {
        printSuccess(`Deleted note ${result.data.id}`);
      }
    });
}
