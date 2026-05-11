"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPathAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.findPathAction = {
    name: "find-path",
    describe: "Find the shortest graph path between two nodes (max depth 1-3).",
    mcpTool: "find_path",
    args: (cmd) => cmd
        .requiredOption("--from-node-id <id>", "Source node ID")
        .requiredOption("--to-node-id <id>", "Target node ID")
        .option("--max-depth <n>", "Max search depth (1-3)", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.findPath({
            fromNodeId: input.fromNodeId,
            toNodeId: input.toNodeId,
            maxDepth: input.maxDepth,
            workspaceId,
        });
    },
};
