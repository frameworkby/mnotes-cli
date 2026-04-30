"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setImportanceAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.setImportanceAction = {
    name: "set-importance",
    describe: "Set the importance score for a knowledge entry or note. Importance influences retrieval ranking in recall_knowledge — higher importance entries surface first.",
    mcpTool: "set_importance",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Note ID")
        .requiredOption("--importance <n>", "Importance score (0-1)", (v) => parseFloat(v))
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.setImportance(input.id, {
            importance: input.importance,
            workspaceId,
        });
    },
};
