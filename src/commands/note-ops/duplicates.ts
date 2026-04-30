import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  noteId: string;
  threshold?: number;
  limit?: number;
  workspaceId?: string;
}

export const duplicatesAction: ActionDescriptor<Input, unknown> = {
  name: "duplicates",
  describe: "Find semantically-similar duplicates of a note.",
  mcpTool: "find_duplicates",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--note-id <id>", "Source note ID")
      .option("--threshold <n>", "Similarity threshold 0.5-1 (default 0.8)", (v) =>
        parseFloat(v),
      )
      .option("--limit <n>", "Max results (1-50)", (v) => parseInt(v, 10))
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.findDuplicates({
      workspaceId,
      noteId: input.noteId,
      threshold: input.threshold,
      limit: input.limit,
    });
  },
};
