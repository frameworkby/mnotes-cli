"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSessionsAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.listSessionsAction = {
    name: "list",
    describe: "List recent session traces for the user (paginated). Returns id, sessionLabel, startedAt, endedAt, toolCallCount, and noteIds.",
    mcpTool: "list_sessions",
    args: (cmd) => cmd
        .option("--workspace-id <id>", "Workspace ID")
        .option("--limit <n>", "Max results (1-50, default 20)", (v) => parseInt(v, 10))
        .option("--cursor <id>", "Pagination cursor"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.listSessions({
            workspaceId,
            limit: input.limit,
            cursor: input.cursor,
        });
    },
};
