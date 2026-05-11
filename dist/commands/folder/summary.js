"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.folderSummaryAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.folderSummaryAction = {
    name: "summary",
    // Mirrored verbatim from MCP `get_workspace_summary` description.
    describe: "Get a high-level workspace overview: total notes and folders, nested folder tree with note counts, recent activity (last 5 modified notes), top 20 tags by usage, and note counts per type. Useful for AI agent orientation in an unfamiliar workspace.",
    mcpTool: "get_workspace_summary",
    args: (cmd) => cmd,
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.getWorkspaceSummary(workspaceId);
    },
};
