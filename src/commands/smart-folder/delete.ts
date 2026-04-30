import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SmartFolderDeleteResult } from "../../client";

interface DeleteSmartFolderInput {
  id: string;
  workspaceId?: string;
}

export const deleteSmartFolderAction: ActionDescriptor<
  DeleteSmartFolderInput,
  SmartFolderDeleteResult
> = {
  name: "delete",
  describe: "Delete a smart folder by ID.",
  mcpTool: "delete_smart_folder",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Smart folder ID")
      .option("--workspace-id <id>", "Workspace ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.deleteSmartFolder(input.id, workspaceId);
  },
};
