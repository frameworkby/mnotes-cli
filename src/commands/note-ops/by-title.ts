import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  title: string;
  workspaceId?: string;
}

export const byTitleAction: ActionDescriptor<Input, unknown> = {
  name: "by-title",
  describe: "Look up a note by exact title.",
  mcpTool: "get_note_by_title",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--title <s>", "Exact note title")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getNoteByTitle({ workspaceId, title: input.title });
  },
};
