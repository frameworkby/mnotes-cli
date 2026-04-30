import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
  limit?: number;
  workspaceId?: string;
}

export const versionsAction: ActionDescriptor<Input, unknown> = {
  name: "versions",
  describe: "List historical versions of a note (default: 10, max 50).",
  mcpTool: "list_versions",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .option("--limit <n>", "Max results (1-50)", (v) => parseInt(v, 10))
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.listVersions(input.id, { workspaceId, limit: input.limit });
  },
};
