"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionReplayAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.sessionReplayAction = {
    name: "replay",
    describe: "Fetch a single session trace by ID, including all tool calls, affected note IDs, and timestamps.",
    mcpTool: "get_session_replay",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Session trace ID")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.getSessionReplay(input.id, workspaceId);
    },
};
