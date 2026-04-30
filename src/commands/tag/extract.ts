import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  noteId: string;
  workspaceId?: string;
}

export const extractEntitiesAction: ActionDescriptor<Input, unknown> = {
  name: "extract",
  describe: "AI-extract entities (people, projects, concepts, orgs, locations) from a note.",
  mcpTool: "extract_entities",
  positional: ["noteId"],
  args: (cmd: Command) =>
    cmd
      .argument("<noteId>", "Source note ID")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.extractEntities({ noteId: input.noteId, workspaceId });
  },
};
