"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRecipeAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.runRecipeAction = {
    name: "run",
    describe: "Run a prompt recipe against a note. Fetches the note content, substitutes {{note_title}} and {{note_content}} placeholders in the recipe template, and returns the AI response.",
    mcpTool: "run_recipe",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Recipe ID")
        .requiredOption("--note-id <id>", "Note ID to run the recipe against"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.runRecipe(input.id, { workspaceId, noteId: input.noteId });
    },
};
