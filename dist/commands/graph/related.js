"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relatedNotesAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.relatedNotesAction = {
    name: "related",
    describe: "Find notes semantically related to the given note via embedding similarity.",
    mcpTool: "related_notes",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Note ID")
        .option("--workspace-id <id>", "Workspace ID")
        .option("--limit <n>", "Max results (1-50)", (v) => parseInt(v, 10))
        .option("--min-similarity <n>", "Minimum cosine similarity (0-1)", (v) => parseFloat(v)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.relatedNotes(input.id, {
            workspaceId,
            limit: input.limit,
            minSimilarity: input.minSimilarity,
        });
    },
};
