"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.starredAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.starredAction = {
    name: "starred",
    describe: "List starred notes for the workspace.",
    mcpTool: "list_starred",
    args: (cmd) => cmd.option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId)
            throw new Error("workspaceId is required");
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.listStarred(workspaceId);
    },
};
