"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staleAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.staleAction = {
    name: "stale",
    describe: "List notes not updated in N days (default 30).",
    mcpTool: "stale_notes",
    args: (cmd) => cmd
        .option("--days <n>", "Days since last update (1-365) — alias for --days-since", (v) => parseInt(v, 10))
        .option("--days-since <n>", "Days since last update (1-365)", (v) => parseInt(v, 10))
        .option("--limit <n>", "Max results (1-200)", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId)
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.staleNotes({
            workspaceId,
            daysSince: input.daysSince ?? input.days,
            limit: input.limit,
        });
    },
};
