import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { GraphResult } from "../../client";

interface NeighborsInput {
  nodeId: string;
  depth?: number;
  edgeType?: string;
}

export const neighborsAction: ActionDescriptor<NeighborsInput, GraphResult> = {
  name: "neighbors",
  describe:
    "Fetch graph neighbors of a node up to a given depth (BFS, distinct nodes).",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--node-id <id>", "Start node ID")
      .option("--depth <n>", "Traversal depth (1-3)", (v) => parseInt(v, 10), 1)
      .option("--edge-type <t>", "Filter edges by type"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getNeighbors({
      nodeId: input.nodeId,
      depth: input.depth,
      workspaceId,
    });
  },
};
