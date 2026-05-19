import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import { printSuccess } from "../../output";
import type { ActionDescriptor } from "../_register-group";
import { maybeWarnTitleSlash } from "../_title-slash-warning";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

interface CreateInput {
  title: string;
  content?: string;
  folderId?: string;
  /** Alias for folderId — accepted when the user types --folder instead of --folder-id. */
  folder?: string;
  tags?: string[];
}

interface CreateOutput {
  id: string;
  title: string;
}

export const createNoteAction: ActionDescriptor<CreateInput, CreateOutput> = {
  name: "create",
  describe: "Create a new note",
  mcpTool: "create_note",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--title <title>", "Note title")
      .option("--content <content>", "Note content (otherwise read from stdin)")
      .option("--folder-id <id>", "Folder ID")
      .option("--folder <id>", "Alias for --folder-id")
      .option(
        "--tags <tags...>",
        "Tags (space-separated)",
      ),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);

    const folderId = input.folderId ?? input.folder;
    maybeWarnTitleSlash(input.title, Boolean(folderId));

    let content = input.content;
    if (content === undefined && !process.stdin.isTTY) {
      const stdinContent = await readStdin();
      if (stdinContent.length > 0) content = stdinContent;
    }

    const res = await client.createNote({
      title: input.title,
      content,
      folderId,
      tags: input.tags,
      workspaceId: config.workspaceId,
    });

    return res.data;
  },

  renderHuman: (output) => {
    printSuccess(`Created note ${output.id}: ${output.title}`);
  },
};
