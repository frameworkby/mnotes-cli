import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  query?: string;
  path?: string;
  workspaceId?: string;
}

export const projectLoadAction: ActionDescriptor<Input, unknown> = {
  name: "project-load",
  describe: "Composite tool: load project context (folder summary + recent notes + memory recall) in one call.",
  mcpTool: "project_context_load",
  args: (cmd: Command) =>
    cmd
      .option("--query <s>", "Optional semantic query")
      .option("--path <s>", "Optional folder path scope")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.projectContextLoad({
      workspaceId,
      query: input.query,
      path: input.path,
    });
  },
};
