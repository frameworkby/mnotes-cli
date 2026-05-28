import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { ClusterResult } from "../../client";

interface GetClustersInput {
}

export const getClustersAction: ActionDescriptor<GetClustersInput, ClusterResult> = {
  name: "get",
  describe:
    "Return cached k-means clusters of notes by embedding (computed via the /clusters page).",
  args: (cmd: Command) => cmd,

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getClusters(workspaceId);
  },
};
