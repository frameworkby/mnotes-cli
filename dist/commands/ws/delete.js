"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWsAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.deleteWsAction = {
    name: "delete",
    describe: "Delete a workspace (owner only). Destructive — use with care.",
    mcpTool: "delete_workspace",
    positional: ["id"],
    args: (cmd) => cmd.argument("<id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.deleteWorkspace(input.id);
    },
};
