import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
  versionId: string;
}

export const restoreVersionAction: ActionDescriptor<Input, unknown> = {
  name: "restore-version",
  describe: "Restore a note to a previous version snapshot.",
  mcpTool: "restore_version",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .requiredOption("--version-id <id>", "Version ID to restore"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.restoreVersion(input.id, { workspaceId, versionId: input.versionId });
  },
};
