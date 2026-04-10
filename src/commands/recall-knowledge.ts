import { Command } from "commander";
import { resolveConfig } from "../config";
import { createClient } from "../client";
import { printJson, printGraph } from "../output";

export function registerRecallKnowledgeCommand(program: Command): void {
  program
    .command("recall_knowledge")
    .description("Query the knowledge graph (read-only)")
    .option("--query <text>", "Filter nodes by label (case-insensitive)")
    .option("--type <type>", "Filter by node type: note, tag, concept")
    .option("--neighbors <nodeId>", "Show neighbors of a specific node")
    .option("--depth <n>", "Neighbor traversal depth (1-3, default 1)", "1")
    .option("--limit <n>", "Max nodes to return (default 50)", "50")
    .option("--workspace-id <id>", "Workspace ID")
    .action(async (opts: Record<string, string | undefined>) => {
      const globalOpts = program.opts();
      const config = resolveConfig(globalOpts);
      const client = createClient(config.baseUrl, config.apiKey);

      const result = await client.queryGraph({
        workspaceId: opts.workspaceId || config.workspaceId,
        query: opts.query,
        nodeType: opts.type,
        neighbors: opts.neighbors,
        depth: opts.depth ? parseInt(opts.depth, 10) : undefined,
        limit: opts.limit ? parseInt(opts.limit, 10) : undefined,
      });

      if (globalOpts.json) {
        printJson(result.data);
      } else {
        printGraph(result.data.nodes, result.data.edges);
      }
    });
}
