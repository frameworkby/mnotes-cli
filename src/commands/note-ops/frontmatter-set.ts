import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  id: string;
  fields: string;
  workspaceId?: string;
}

export const frontmatterSetAction: ActionDescriptor<Input, unknown> = {
  name: "frontmatter-set",
  describe:
    'Set/merge YAML frontmatter fields. --fields is a JSON object, e.g. \'{"status":"draft"}\'.',
  mcpTool: "set_note_frontmatter",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .requiredOption("--fields <json>", "JSON object of fields")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const fields = JSON.parse(input.fields) as Record<string, unknown>;
    const client = createClient(config.baseUrl, config.apiKey);
    return client.setNoteFrontmatter(input.id, { workspaceId, fields });
  },
};
