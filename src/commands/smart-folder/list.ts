import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SmartFolder } from "../../client";

interface ListSmartFoldersInput {
  workspaceId?: string;
}

export const listSmartFoldersAction: ActionDescriptor<
  ListSmartFoldersInput,
  SmartFolder[]
> = {
  name: "list",
  describe:
    "List saved smart folders (saved searches) for the current workspace.",
  mcpTool: "list_smart_folders",
  args: (cmd: Command) => cmd.option("--workspace-id <id>", "Workspace ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.listSmartFolders(workspaceId);
  },
};
