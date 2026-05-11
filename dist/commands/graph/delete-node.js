"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNodeAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.deleteNodeAction = {
    name: "delete-node",
    describe: "Delete a graph node by ID. Cascades to its edges.",
    mcpTool: "delete_node",
    positional: ["id"],
    args: (cmd) => cmd.argument("<id>", "Node ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.deleteGraphNode(input.id, workspaceId);
    },
};
