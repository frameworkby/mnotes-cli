import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  client?: string;
  baseUrl?: string;
  workspaceId?: string;
}

export const instructionsAction: ActionDescriptor<Input, unknown> = {
  name: "instructions",
  describe: "Generate setup instructions for an MCP-capable AI client (claude-code, claude-desktop, cursor, windsurf, vscode-copilot, generic).",
  mcpTool: "generate_agent_instructions",
  args: (cmd: Command) =>
    cmd
      .option("--client <s>", "Target client")
      .option("--base-url <url>", "Override base URL")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);
    return client.generateAgentInstructions({
      workspaceId: input.workspaceId ?? config.workspaceId,
      client: input.client,
      baseUrl: input.baseUrl,
    });
  },
};
