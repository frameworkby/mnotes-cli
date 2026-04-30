import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { RunRecipeResult } from "../../client";

interface Input {
  id: string;
  noteId: string;
  workspaceId?: string;
}

export const runRecipeAction: ActionDescriptor<Input, RunRecipeResult> = {
  name: "run",
  describe:
    "Run a prompt recipe against a note. Fetches the note content, substitutes {{note_title}} and {{note_content}} placeholders in the recipe template, and returns the AI response.",
  mcpTool: "run_recipe",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Recipe ID")
      .requiredOption("--note-id <id>", "Note ID to run the recipe against")
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
    return client.runRecipe(input.id, { workspaceId, noteId: input.noteId });
  },
};
