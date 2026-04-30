"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryGraphAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.queryGraphAction = {
    name: "query",
    describe: "Advanced graph query: filter nodes by type/label, edges by type, or expand from a connected node.",
    mcpTool: "query_graph",
    args: (cmd) => cmd
        .option("--workspace-id <id>", "Workspace ID")
        .option("--node-type <t>", "Filter by node type")
        .option("--label-contains <s>", "Filter by label substring")
        .option("--edge-type <t>", "Filter by edge type")
        .option("--connected-to <id>", "Expand from this node ID")
        .option("--depth <n>", "Expansion depth (1-3)", (v) => parseInt(v, 10))
        .option("--limit <n>", "Max nodes (1-200)", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.queryGraphAdvanced({
            nodeType: input.nodeType,
            labelContains: input.labelContains,
            edgeType: input.edgeType,
            connectedTo: input.connectedTo,
            depth: input.depth,
            limit: input.limit,
            workspaceId,
        });
    },
};
