"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestTagsLinksAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.suggestTagsLinksAction = {
    name: "suggest-tags-links",
    describe: "Get AI-powered tag and wikilink suggestions for a note based on semantic similarity. Uses the note's existing embedding to find similar notes (score >= 0.75).",
    mcpTool: "suggest_tags_links",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Note ID")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.suggestTagsLinks(input.id, workspaceId);
    },
};
