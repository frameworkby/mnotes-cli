import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  noteId: string;
}

export const extractEntitiesAction: ActionDescriptor<Input, unknown> = {
  name: "extract",
  describe: "AI-extract entities (people, projects, concepts, orgs, locations) from a note.",
  mcpTool: "extract_entities",
  positional: ["noteId"],
  args: (cmd: Command) =>
    cmd
      .argument("<noteId>", "Source note ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.extractEntities({ noteId: input.noteId, workspaceId });
  },
};
