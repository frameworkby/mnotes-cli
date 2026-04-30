"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRecallKnowledgeCommand = registerRecallKnowledgeCommand;
const config_1 = require("../config");
const client_1 = require("../client");
const output_1 = require("../output");
function registerRecallKnowledgeCommand(program) {
    program
        .command("recall_knowledge")
        .description("Query knowledge entries via semantic search (read-only)")
        .option("--query <text>", "Search query (required for semantic recall)")
        .option("--tags <tags>", "Filter by tags (comma-separated)")
        .option("--limit <n>", "Max results (default 10)", "10")
        .option("--graph", "Query the knowledge graph (GraphNode/GraphEdge) instead of semantic recall")
        .option("--type <type>", "Node type filter (graph mode only): note, tag, concept")
        .option("--neighbors <nodeId>", "Show neighbors of a node (graph mode only)")
        .option("--depth <n>", "Neighbor traversal depth 1-3 (graph mode only)", "1")
        .option("--workspace-id <id>", "Workspace ID")
        .action(async (opts) => {
        const globalOpts = program.opts();
        const config = (0, config_1.resolveConfig)(globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const workspaceId = opts.workspaceId || config.workspaceId;
        // Graph mode
        if (opts.graph) {
            const result = await client.queryGraph({
                workspaceId,
                query: opts.query,
                nodeType: opts.type,
                neighbors: opts.neighbors,
                depth: opts.depth ? parseInt(opts.depth, 10) : undefined,
                limit: opts.limit ? parseInt(opts.limit, 10) : undefined,
            });
            if (globalOpts.json) {
                (0, output_1.printJson)(result.data);
            }
            else {
                (0, output_1.printGraph)(result.data.nodes, result.data.edges);
            }
            return;
        }
        // Semantic recall mode (default)
        if (!opts.query) {
            process.stderr.write("Error: --query is required for semantic recall. Use --graph for graph queries without a query.\n");
            process.exit(1);
        }
        const tags = opts.tags ? opts.tags.split(",").map((t) => t.trim()) : undefined;
        const result = await client.recallKnowledge({
            query: opts.query,
            workspaceId,
            tags,
            limit: opts.limit ? parseInt(opts.limit, 10) : undefined,
        });
        if (globalOpts.json) {
            (0, output_1.printJson)(result.data.results);
        }
        else {
            (0, output_1.printKnowledgeResults)(result.data.results);
        }
    });
}
