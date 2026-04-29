import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { FolderRecord } from "../../client";

interface MoveInput {
  id: string;
  parentId?: string;
  root?: boolean;
}

export const moveFolderAction: ActionDescriptor<MoveInput, FolderRecord> = {
  name: "move",
  // Mirrored verbatim from MCP `move_folder` description.
  describe:
    "Change a folder's parent. Set parentId to null to move to root level. Cannot move the root folder. Maximum nesting depth is 1.",
  mcpTool: "move_folder",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Folder ID to move")
      .option("--parent-id <id>", "New parent folder ID")
      .option("--root", "Move to root level (parentId = null)"),

  run: async (input, ctx) => {
    if (input.parentId && input.root) {
      throw new Error("--parent-id and --root are mutually exclusive");
    }
    if (!input.parentId && !input.root) {
      throw new Error("specify --parent-id <id> or --root");
    }
    const parentId = input.root ? null : input.parentId ?? null;
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);
    return client.moveFolder(input.id, parentId);
  },
};
