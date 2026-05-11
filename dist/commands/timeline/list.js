"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTimelineAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.listTimelineAction = {
    name: "list",
    describe: "List notes by creation date (newest first). Optionally filter by ISO date range and limit (max 200, default 100).",
    mcpTool: "list_timeline",
    args: (cmd) => cmd
        .option("--from <iso>", "Lower bound ISO datetime (inclusive)")
        .option("--to <iso>", "Upper bound ISO datetime (inclusive)")
        .option("--limit <n>", "Max results (1-200, default 100)", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.listTimeline({
            workspaceId,
            from: input.from,
            to: input.to,
            limit: input.limit,
        });
    },
};
