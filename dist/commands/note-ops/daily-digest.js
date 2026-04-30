"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyDigestAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.dailyDigestAction = {
    name: "daily-digest",
    describe: "Summary of notes touched on a date (default: today).",
    mcpTool: "daily_digest",
    args: (cmd) => cmd
        .option("--date <s>", "ISO date YYYY-MM-DD (default: today)")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId)
            throw new Error("workspaceId is required");
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.dailyDigest({ workspaceId, date: input.date });
    },
};
