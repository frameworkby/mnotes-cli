"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.statsAction = {
    name: "stats",
    describe: "Get knowledge base statistics: total notes, total tags, orphan count, stale count, conflict count, and embedding coverage.",
    mcpTool: "get_kb_stats",
    args: (cmd) => cmd,
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.getKbStats(workspaceId);
    },
};
