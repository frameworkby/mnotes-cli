import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
  starred?: boolean;
  unstar?: boolean;
}

export const starAction: ActionDescriptor<Input, unknown> = {
  name: "star",
  describe: "Star or unstar a note (default: star). Pass --no-starred to unstar.",
  mcpTool: "toggle_star",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .option("--starred", "Star the note (default true)", true)
      .option("--no-starred", "Unstar the note"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    const starred = input.starred !== false;
    const client = createClient(config.baseUrl, config.apiKey);
    return client.toggleStar(input.id, { workspaceId, starred });
  },
};
