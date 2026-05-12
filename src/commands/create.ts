import { Command } from "commander";
import { resolveConfig } from "../config";
import { createClient } from "../client";
import { printJson, printSuccess } from "../output";
import { maybeWarnTitleSlash } from "./_title-slash-warning";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export function registerCreateCommand(program: Command): void {
  program
    .command("create")
    .description("Create a new note (reads content from stdin)")
    .requiredOption("--title <title>", "Note title")
    .option("--folder-id <id>", "Folder ID")
    .action(async (opts: Record<string, string | undefined>) => {
      const globalOpts = program.opts();
      const config = resolveConfig(globalOpts);
      const client = createClient(config.baseUrl, config.apiKey);

      let content: string | undefined;
      if (!process.stdin.isTTY) {
        content = await readStdin();
        if (content.length === 0) {
          content = undefined;
        }
      }

      const title = opts.title as string;
      maybeWarnTitleSlash(title, Boolean(opts.folderId));

      const result = await client.createNote({
        title,
        content,
        folderId: opts.folderId as string | undefined,
        workspaceId: (opts.workspaceId as string | undefined) || config.workspaceId,
      });

      if (globalOpts.json) {
        printJson(result.data);
      } else {
        printSuccess(`Created note ${result.data.id}: ${result.data.title}`);
      }
    });
}
