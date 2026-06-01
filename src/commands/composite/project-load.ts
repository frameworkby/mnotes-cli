import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  query?: string;
  path?: string;
}

export const projectLoadAction: ActionDescriptor<Input, unknown> = {
  name: "project-load",
  describe: "Composite tool: load project context (folder summary + recent notes + memory recall) in one call.",
  args: (cmd: Command) =>
    cmd
      .option("--query <s>", "Optional semantic query")
      .option("--path <s>", "Optional folder path scope"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.projectContextLoad({
      workspaceId,
      query: input.query,
      path: input.path,
    });
  },
};
