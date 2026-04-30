import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { ListObjectTypesResult } from "../../client";

interface Input {
  workspaceId?: string;
}

export const listObjectTypesAction: ActionDescriptor<Input, ListObjectTypesResult> = {
  name: "list",
  describe:
    "List all object types (supertags) in the current or specified workspace. Returns id, name, icon, color, property schema, and note count.",
  mcpTool: "list_object_types",
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
    return client.listObjectTypes(workspaceId);
  },
};
