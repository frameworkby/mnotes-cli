import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SuggestTagsResult } from "../../client";

interface Input {
  id: string;
  workspaceId?: string;
}

export const suggestTagsAction: ActionDescriptor<Input, SuggestTagsResult> = {
  name: "suggest-tags",
  describe:
    "Suggest up to 5 relevant tags for a note based on semantic similarity. Finds the top-10 most similar notes and returns the most frequent tags across them.",
  mcpTool: "suggest_tags",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.suggestTags(input.id, workspaceId);
  },
};
