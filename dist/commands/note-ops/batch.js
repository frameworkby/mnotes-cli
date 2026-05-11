"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.batchAction = {
    name: "batch",
    describe: "Fetch multiple notes by ID (max 50).",
    mcpTool: "get_notes",
    args: (cmd) => cmd
        .requiredOption("--ids <csv>", "Comma-separated note IDs (max 50)"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId)
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        const ids = input.ids
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.getNotesBatch({ workspaceId, ids });
    },
};
