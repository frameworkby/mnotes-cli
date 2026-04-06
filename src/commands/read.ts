import { Command } from "commander";
import { resolveConfig } from "../config";
import { createClient } from "../client";
import { printJson, printNote } from "../output";

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
    });
}
