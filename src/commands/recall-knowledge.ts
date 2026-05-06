import { Command } from "commander";
import { resolveConfig } from "../config";
import { createClient } from "../client";
import { printJson, printGraph, printKnowledgeResults } from "../output";

export function registerRecallKnowledgeCommand(program: Command): void {
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
    .action(async (opts: Record<string, string | boolean | undefined>) => {
      const globalOpts = program.opts();
      const config = resolveConfig(globalOpts);
      const client = createClient(config.baseUrl, config.apiKey);
      const workspaceId = (opts.workspaceId as string | undefined) || config.workspaceId;

      // Graph mode
      if (opts.graph) {
        const result = await client.queryGraph({
          workspaceId,
          query: opts.query as string | undefined,
          nodeType: opts.type as string | undefined,
          neighbors: opts.neighbors as string | undefined,
          depth: opts.depth ? parseInt(opts.depth as string, 10) : undefined,
          limit: opts.limit ? parseInt(opts.limit as string, 10) : undefined,
        });

        if (globalOpts.json) {
          printJson(result.data);
        } else {
          printGraph(result.data.nodes, result.data.edges);
        }
        return;
      }

      // Semantic recall mode (default)
      if (!opts.query) {
        process.stderr.write("Error: --query is required for semantic recall. Use --graph for graph queries without a query.\n");
        process.exit(1);
      }

      const tags = opts.tags ? (opts.tags as string).split(",").map((t) => t.trim()) : undefined;

      const result = await client.recallKnowledge({
        query: opts.query as string,
        workspaceId,
        tags,
        limit: opts.limit ? parseInt(opts.limit as string, 10) : undefined,
      });

      if (globalOpts.json) {
        printJson(result.data.results);
      } else {
        printKnowledgeResults(result.data.results);
      }
    });
}
