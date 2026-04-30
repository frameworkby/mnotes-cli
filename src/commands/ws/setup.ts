import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  name: string;
  template?: string;
  description?: string;
  icon?: string;
}

export const setupWsAction: ActionDescriptor<Input, unknown> = {
  name: "setup",
  describe: "Create a new workspace from a template (default: remedy-pod).",
  mcpTool: "setup_workspace",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--name <s>", "Workspace name")
      .option("--template <s>", "Template id (default: remedy-pod)")
      .option("--description <s>", "Optional description")
      .option("--icon <s>", "Optional icon"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);
    return client.setupWorkspace({
      name: input.name,
      template: input.template,
      description: input.description,
      icon: input.icon,
    });
  },
};
