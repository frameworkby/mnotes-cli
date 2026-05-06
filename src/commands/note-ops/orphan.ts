import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  limit?: number;
}

export const orphanAction: ActionDescriptor<Input, unknown> = {
  name: "orphan",
  describe: "List notes with no incoming or outgoing wikilinks.",
  mcpTool: "orphan_notes",
  args: (cmd: Command) =>
    cmd
      .option("--limit <n>", "Max results (1-200)", (v) => parseInt(v, 10)),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.orphanNotes({ workspaceId, limit: input.limit });
  },
};
