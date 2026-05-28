import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  ids: string;
}

export const batchAction: ActionDescriptor<Input, unknown> = {
  name: "batch",
  describe: "Fetch multiple notes by ID (max 50).",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--ids <csv>", "Comma-separated note IDs (max 50)"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    const ids = input.ids
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getNotesBatch({ workspaceId, ids });
  },
};
