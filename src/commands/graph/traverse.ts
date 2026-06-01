import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { GraphTraverseResult } from "../../client";

interface TraverseInput {
  startNodeId: string;
  maxDepth?: number;
  edgeTypes?: string;
  nodeTypes?: string;
}

function csv(value?: string): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const traverseAction: ActionDescriptor<TraverseInput, GraphTraverseResult> = {
  name: "traverse",
  describe:
    "Traverse the graph from a start node with edge/node-type filters and a max depth.",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--start-node-id <id>", "Start node ID")
      .option("--max-depth <n>", "Max traversal depth (1-3)", (v) => parseInt(v, 10))
      .option("--edge-types <csv>", "Comma-separated edge types to include")
      .option("--node-types <csv>", "Comma-separated node types to keep"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.graphTraverse({
      startNodeId: input.startNodeId,
      maxDepth: input.maxDepth,
      edgeTypes: csv(input.edgeTypes),
      nodeTypes: csv(input.nodeTypes),
      workspaceId,
    });
  },
};
