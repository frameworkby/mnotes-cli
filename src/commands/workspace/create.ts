import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import { readConfig, writeConfig } from "../login";
import { printSuccess } from "../../output";
import type { ActionDescriptor } from "../_register-group";

interface CreateInput {
  name: string;
  description?: string;
}

interface CreateOutput {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
}

export const createWorkspaceAction: ActionDescriptor<CreateInput, CreateOutput> = {
  name: "create",
  describe: "Create a new workspace",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--name <name>", "Workspace name")
      .option("--description <text>", "Workspace description"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);

    const res = await client.createWorkspace(input.name, {
      description: input.description,
    });

    // Auto-link to current directory (mirrors legacy behavior).
    const stored = readConfig();
    if (stored) {
      const workspaces = stored.workspaces ?? {};
      workspaces[process.cwd()] = res.data.id;
      writeConfig({ ...stored, workspaces });
    }

    return res.data;
  },

  renderHuman: (output) => {
    printSuccess(`Created workspace ${output.name} [${output.slug}]`);
    printSuccess(`Linked ${process.cwd()} -> ${output.name}`);
  },
};
