import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { FindPathResult } from "../../client";

interface FindPathInput {
  workspaceId?: string;
  fromNodeId: string;
  toNodeId: string;
  maxDepth?: number;
}

export const findPathAction: ActionDescriptor<FindPathInput, FindPathResult> = {
  name: "find-path",
  describe: "Find the shortest graph path between two nodes (max depth 1-3).",
  mcpTool: "find_path",
  args: (cmd: Command) =>
    cmd
      .option("--workspace-id <id>", "Workspace ID")
      .requiredOption("--from-node-id <id>", "Source node ID")
      .requiredOption("--to-node-id <id>", "Target node ID")
      .option("--max-depth <n>", "Max search depth (1-3)", (v) => parseInt(v, 10)),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.findPath({
      fromNodeId: input.fromNodeId,
      toNodeId: input.toNodeId,
      maxDepth: input.maxDepth,
      workspaceId,
    });
  },
};
