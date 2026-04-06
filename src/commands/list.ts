import { Command } from "commander";
import { resolveConfig } from "../config";
import { createClient } from "../client";
import { printJson, printNoteList } from "../output";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List notes")
    .option("--workspace-id <id>", "Workspace ID")
    .option("--folder-id <id>", "Folder ID")
    .option("--cursor <cursor>", "Pagination cursor")
    .option("--limit <n>", "Max notes to return", parseInt)
    .action(async (opts: Record<string, string | number | undefined>) => {
      const globalOpts = program.opts();
      const config = resolveConfig(globalOpts);
      const client = createClient(config.baseUrl, config.apiKey);

      const result = await client.listNotes({
        workspaceId: opts.workspaceId as string | undefined,
        folderId: opts.folderId as string | undefined,
        cursor: opts.cursor as string | undefined,
        limit: opts.limit as number | undefined,
      });

      if (globalOpts.json) {
        printJson(result);
      } else {
        printNoteList(result.data);
        if (result.nextCursor) {
          process.stderr.write(
            `\nMore results available. Use --cursor ${result.nextCursor}\n`
          );
        }
      }
    });
}
