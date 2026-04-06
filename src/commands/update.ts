import { Command } from "commander";
import { resolveConfig } from "../config";
import { createClient } from "../client";
import { printJson, printSuccess } from "../output";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export function registerUpdateCommand(program: Command): void {
  program
    .command("update <id>")
    .description("Update a note (reads new content from stdin)")
    .option("--title <title>", "New title")
    .action(async (id: string, opts: Record<string, string | undefined>) => {
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

      if (!opts.title && content === undefined) {
        process.stderr.write(
          "Error: Provide --title and/or pipe content via stdin\n"
        );
        process.exit(1);
      }

      const updateOpts: { title?: string; content?: string } = {};
      if (opts.title) updateOpts.title = opts.title;
      if (content !== undefined) updateOpts.content = content;

      const result = await client.updateNote(id, updateOpts);

      if (globalOpts.json) {
        printJson(result.data);
      } else {
        printSuccess(`Updated note ${result.data.id}: ${result.data.title}`);
      }
    });
}
