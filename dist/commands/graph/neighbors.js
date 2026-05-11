"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.neighborsAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.neighborsAction = {
    name: "neighbors",
    describe: "Fetch graph neighbors of a node up to a given depth (BFS, distinct nodes).",
    mcpTool: "get_neighbors",
    args: (cmd) => cmd
        .requiredOption("--node-id <id>", "Start node ID")
        .option("--depth <n>", "Traversal depth (1-3)", (v) => parseInt(v, 10), 1)
        .option("--edge-type <t>", "Filter edges by type"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.getNeighbors({
            nodeId: input.nodeId,
            depth: input.depth,
            workspaceId,
        });
    },
};
