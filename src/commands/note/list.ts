import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import { printNoteList } from "../../output";
import type { ActionDescriptor } from "../_register-group";
import type { NoteListItem } from "../../client";

interface ListInput {
  workspaceId?: string;
  folderId?: string;
  cursor?: string;
  // Commander coerces `--limit` via `parseInt` in `args` below, so handlers
  // always see `number | undefined` here.
  limit?: number;
}

interface ListOutput {
  notes: NoteListItem[];
  nextCursor: string | null;
}

export const listAction: ActionDescriptor<ListInput, ListOutput> = {
  name: "list",
  describe: "List notes",
  mcpTool: "list_notes",
  aliases: ["list"], // legacy `mnotes list`
  args: (cmd: Command) =>
    cmd
      .option("--workspace-id <id>", "Workspace ID")
      .option("--folder-id <id>", "Folder ID")
      .option("--cursor <cursor>", "Pagination cursor")
      .option("--limit <n>", "Max notes to return", (v) => parseInt(v, 10)),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);

    const apiResp = await client.listNotes({
      workspaceId: input.workspaceId ?? config.workspaceId,
      folderId: input.folderId,
      cursor: input.cursor,
      limit: input.limit,
    });

    // Reshape API response (`{ data, nextCursor }`) into MCP `list_notes` shape
    // (`{ notes, nextCursor }`). This is the parity contract: top-level keys
    // match the MCP tool's response.
    return {
      notes: apiResp.data,
      nextCursor: apiResp.nextCursor,
    };
  },

  renderHuman: (output) => {
    printNoteList(output.notes);
    if (output.nextCursor) {
      process.stderr.write(
        `\nMore results available. Use --cursor ${output.nextCursor}\n`,
      );
    }
  },
};
