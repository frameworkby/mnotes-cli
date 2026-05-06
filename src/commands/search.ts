import { Command } from "commander";
import { resolveConfig } from "../config";
import { createClient } from "../client";
import { printJson, printSearchResults } from "../output";

export function registerSearchCommand(program: Command): void {
  program
    .command("search <query>")
    .description("Search notes")
    .option("--semantic", "Use semantic (vector) search instead of full-text")
    .action(async (query: string, opts: Record<string, string | boolean | undefined>) => {
      const globalOpts = program.opts();
      const config = resolveConfig(globalOpts);
      const client = createClient(config.baseUrl, config.apiKey);

      const result = await client.searchNotes({
        query,
        mode: opts.semantic ? "semantic" : "fulltext",
        workspaceId: (opts.workspaceId as string | undefined) || config.workspaceId,
      });

      if (globalOpts.json) {
        printJson(result.data.results);
      } else {
        printSearchResults(result.data.results);
      }
    });
}
