import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { BacklinkNote } from "../../client";

interface BacklinksInput {
  id: string;
}

export const backlinksAction: ActionDescriptor<BacklinksInput, BacklinkNote[]> = {
  name: "backlinks",
  describe: "List notes that wikilink to the given note.",
  mcpTool: "get_backlinks",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd.argument("<id>", "Note ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getBacklinks(input.id, workspaceId);
  },
};
