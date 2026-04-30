"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.roleAction = {
    name: "role",
    describe: "Show the caller's role and capabilities for a workspace.",
    mcpTool: "get_workspace_role",
    positional: ["id"],
    args: (cmd) => cmd.argument("<id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.getWorkspaceRole(input.id);
    },
};
