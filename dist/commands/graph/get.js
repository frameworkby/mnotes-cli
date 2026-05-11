"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGraphAction = void 0;
const commander_1 = require("commander");
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.getGraphAction = {
    name: "get",
    describe: "Fetch the knowledge graph for a workspace, optionally filtered by label query and node type.",
    mcpTool: "get_graph",
    args: (cmd) => cmd
        .option("--query <q>", "Filter nodes whose label contains this string")
        .addOption(new commander_1.Option("--node-type <t>", "Filter by node type").choices([
        "note",
        "tag",
        "concept",
    ]))
        .option("--limit <n>", "Max nodes (1-200)", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.getGraph({
            workspaceId,
            query: input.query,
            nodeType: input.nodeType,
            limit: input.limit,
        });
    },
};
