import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { QueryNoteGraphResult } from "../../client";

interface QueryNoteInput {
  workspaceId?: string;
  noteId: string;
  depth?: number;
}

export const queryNoteGraphAction: ActionDescriptor<QueryNoteInput, QueryNoteGraphResult> = {
  name: "query-note",
  describe:
    "Return the local graph (neighbors and edges) around the graph node linked to a note.",
  mcpTool: "query_note_graph",
  args: (cmd: Command) =>
    cmd
      .option("--workspace-id <id>", "Workspace ID")
      .requiredOption("--note-id <id>", "Note ID")
      .option("--depth <n>", "Neighborhood depth (1-3)", (v) => parseInt(v, 10)),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.queryNoteGraph({
      noteId: input.noteId,
      depth: input.depth,
      workspaceId,
    });
  },
};
