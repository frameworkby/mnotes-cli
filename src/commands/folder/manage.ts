import { Option, type Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import { printSuccess } from "../../output";
import type { ActionDescriptor } from "../_register-group";
import type { FolderRecord } from "../../client";

/**
 * `folder manage` mirrors the MCP `manage_folders` tool which is intentionally
 * action-overloaded (create | rename | delete). Keeping one CLI command
 * preserves a 1:1 parity contract: a single MCP tool maps to a single
 * `commandPath`. The `--action` flag selects the operation.
 *
 * Response shape varies by action and matches the MCP tool's response:
 *   create / rename → folder record
 *   delete          → `{ deleted: id }`
 */
interface ManageInput {
  action: "create" | "rename" | "delete";
  id?: string;
  name?: string;
  parentId?: string;
}

type ManageOutput = FolderRecord | { deleted: string };

export const manageFoldersAction: ActionDescriptor<ManageInput, ManageOutput> = {
  name: "manage",
  // Mirrored verbatim from MCP `manage_folders` description.
  describe:
    'Create, rename, or delete a folder. Actions: "create" (requires name, optional parentId), "rename" (requires id, name), "delete" (requires id, fails if folder contains notes).',
  mcpTool: "manage_folders",
  args: (cmd: Command) =>
    cmd
      .addOption(
        new Option("--action <action>", "Folder action to perform")
          .choices(["create", "rename", "delete"])
          .makeOptionMandatory(true),
      )
      .option("--id <id>", "Folder ID (required for rename and delete)")
      .option("--name <name>", "Folder name (required for create and rename)")
      .option("--parent-id <id>", "Parent folder ID (optional, for create)"),

  renderHuman: (output) => {
    if ("deleted" in output) {
      printSuccess(`Folder ${output.deleted} deleted`);
    } else {
      console.log(`${output.id}  ${output.name}`);
    }
  },

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);

    // `--action` is enforced by Commander's `.choices(...)` so we treat the
    // switch as exhaustive — no runtime "unknown action" branch needed.
    switch (input.action) {
      case "create": {
        if (!input.name) throw new Error("--name is required for create action");
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
          throw new Error(
            "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
          );
        }
        return client.createFolder({
          name: input.name,
          parentId: input.parentId,
          workspaceId,
        });
      }
      case "rename": {
        if (!input.id) throw new Error("--id is required for rename action");
        if (!input.name) throw new Error("--name is required for rename action");
        return client.renameFolder(input.id, input.name);
      }
      case "delete": {
        if (!input.id) throw new Error("--id is required for delete action");
        return client.deleteFolder(input.id);
      }
    }
  },
};
