import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { ListObjectTypesResult } from "../../client";

interface Input {
}

export const listObjectTypesAction: ActionDescriptor<Input, ListObjectTypesResult> = {
  name: "list",
  describe:
    "List all object types (supertags) in the current or specified workspace. Returns id, name, icon, color, property schema, and note count.",
  args: (cmd: Command) => cmd,
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.listObjectTypes(workspaceId);
  },
};
