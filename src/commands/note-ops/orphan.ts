import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  limit?: number;
  workspaceId?: string;
}

export const orphanAction: ActionDescriptor<Input, unknown> = {
  name: "orphan",
  describe: "List notes with no incoming or outgoing wikilinks.",
  mcpTool: "orphan_notes",
  args: (cmd: Command) =>
    cmd
      .option("--limit <n>", "Max results (1-200)", (v) => parseInt(v, 10))
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.orphanNotes({ workspaceId, limit: input.limit });
  },
};
