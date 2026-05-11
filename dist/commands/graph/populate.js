"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateGraphAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.populateGraphAction = {
    name: "populate",
    describe: "Populate the graph for a workspace by syncing nodes and edges from notes/wikilinks.",
    mcpTool: "populate_graph",
    args: (cmd) => cmd,
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.populateGraph({ workspaceId });
    },
};
