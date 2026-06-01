import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SmartFolderDeleteResult } from "../../client";

interface DeleteSmartFolderInput {
  id: string;
}

export const deleteSmartFolderAction: ActionDescriptor<
  DeleteSmartFolderInput,
  SmartFolderDeleteResult
> = {
  name: "delete",
  describe: "Delete a smart folder by ID.",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Smart folder ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.deleteSmartFolder(input.id, workspaceId);
  },
};
