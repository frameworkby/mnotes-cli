"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traverseAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
function csv(value) {
    if (!value)
        return undefined;
    return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}
exports.traverseAction = {
    name: "traverse",
    describe: "Traverse the graph from a start node with edge/node-type filters and a max depth.",
    mcpTool: "graph_traverse",
    args: (cmd) => cmd
        .option("--workspace-id <id>", "Workspace ID")
        .requiredOption("--start-node-id <id>", "Start node ID")
        .option("--max-depth <n>", "Max traversal depth (1-3)", (v) => parseInt(v, 10))
        .option("--edge-types <csv>", "Comma-separated edge types to include")
        .option("--node-types <csv>", "Comma-separated node types to keep"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.graphTraverse({
            startNodeId: input.startNodeId,
            maxDepth: input.maxDepth,
            edgeTypes: csv(input.edgeTypes),
            nodeTypes: csv(input.nodeTypes),
            workspaceId,
        });
    },
};
