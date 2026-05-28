import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
}

export const updateWsAction: ActionDescriptor<Input, unknown> = {
  name: "update",
  describe: "Update a workspace's name, description, or icon.",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Workspace ID")
      .option("--name <s>", "New name")
      .option("--description <s>", "New description")
      .option("--icon <s>", "New icon"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);
    return client.updateWorkspace(input.id, {
      name: input.name,
      description: input.description,
      icon: input.icon,
    });
  },
};
