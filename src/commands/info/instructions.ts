import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  client?: string;
  baseUrl?: string;
}

export const instructionsAction: ActionDescriptor<Input, unknown> = {
  name: "instructions",
  describe: "Generate setup instructions for an AI client (claude-code, claude-desktop, cursor, windsurf, vscode-copilot, generic).",
  args: (cmd: Command) =>
    cmd
      .option("--client <s>", "Target client")
      .option("--base-url <url>", "Override base URL"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);
    return client.generateAgentInstructions({
      workspaceId: config.workspaceId,
      client: input.client,
      baseUrl: input.baseUrl,
    });
  },
};
