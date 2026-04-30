import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { ClusterResult } from "../../client";

interface GetClustersInput {
  workspaceId?: string;
}

export const getClustersAction: ActionDescriptor<GetClustersInput, ClusterResult> = {
  name: "get",
  describe:
    "Return cached k-means clusters of notes by embedding (computed via the /clusters page).",
  mcpTool: "get_clusters",
  args: (cmd: Command) => cmd.option("--workspace-id <id>", "Workspace ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getClusters(workspaceId);
  },
};
