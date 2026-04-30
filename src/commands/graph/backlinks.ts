import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { BacklinkNote } from "../../client";

interface BacklinksInput {
  id: string;
  workspaceId?: string;
}

export const backlinksAction: ActionDescriptor<BacklinksInput, BacklinkNote[]> = {
  name: "backlinks",
  describe: "List notes that wikilink to the given note.",
  mcpTool: "get_backlinks",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd.argument("<id>", "Note ID").option("--workspace-id <id>", "Workspace ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getBacklinks(input.id, workspaceId);
  },
};
