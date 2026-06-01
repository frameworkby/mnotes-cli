import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import { printSuccess } from "../../output";
import type { ActionDescriptor } from "../_register-group";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

interface UpdateInput {
  id: string;
  title?: string;
  content?: string;
  folder?: string;
  tags?: string[];
}

interface UpdateOutput {
  id: string;
  title: string;
}

export const updateNoteAction: ActionDescriptor<UpdateInput, UpdateOutput> = {
  name: "update",
  describe: "Update a note",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .arguments("[id]")
      .option("--id <id>", "Note ID (alias for positional)")
      .option("--title <title>", "New title")
      .option("--content <content>", "New content (otherwise read from stdin)")
      .option("--folder <id>", "New folder ID")
      .option("--tags <tags...>", "Replace tags (space-separated)"),

  run: async (input, ctx) => {
    if (!input.id) {
      process.stderr.write("Error: Note ID required — pass as positional or via --id <id>\n");
      process.exit(1);
    }
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);

    let content = input.content;
    if (content === undefined && !process.stdin.isTTY) {
      const stdinContent = await readStdin();
      if (stdinContent.length > 0) content = stdinContent;
    }

    const opts: { title?: string; content?: string; folderId?: string; tags?: string[] } = {};
    if (input.title !== undefined) opts.title = input.title;
    if (content !== undefined) opts.content = content;
    if (input.folder !== undefined) opts.folderId = input.folder;
    if (input.tags !== undefined) opts.tags = input.tags;

    if (Object.keys(opts).length === 0) {
      process.stderr.write(
        "Error: provide at least one of --title, --content, --folder, --tags (or pipe content via stdin)\n",
      );
      process.exit(1);
    }

    const res = await client.updateNote(input.id, opts);
    return res.data;
  },

  renderHuman: (output) => {
    printSuccess(`Updated note ${output.id}: ${output.title}`);
  },
};
