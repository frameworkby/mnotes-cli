"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.duplicatesAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.duplicatesAction = {
    name: "duplicates",
    describe: "Find semantically-similar duplicates of a note.",
    mcpTool: "find_duplicates",
    args: (cmd) => cmd
        .requiredOption("--note-id <id>", "Source note ID")
        .option("--threshold <n>", "Similarity threshold 0.5-1 (default 0.8)", (v) => parseFloat(v))
        .option("--limit <n>", "Max results (1-50)", (v) => parseInt(v, 10))
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId)
            throw new Error("workspaceId is required");
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.findDuplicates({
            workspaceId,
            noteId: input.noteId,
            threshold: input.threshold,
            limit: input.limit,
        });
    },
};
