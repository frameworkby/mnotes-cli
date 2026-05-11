"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestTagsAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.suggestTagsAction = {
    name: "suggest-tags",
    describe: "Suggest up to 5 relevant tags for a note based on semantic similarity. Finds the top-10 most similar notes and returns the most frequent tags across them.",
    mcpTool: "suggest_tags",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Note ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.suggestTags(input.id, workspaceId);
    },
};
