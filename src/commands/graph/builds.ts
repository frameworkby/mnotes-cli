import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { GraphBuildRecord } from "../../client";

export const listBuildsAction: ActionDescriptor<Record<string, never>, { builds: GraphBuildRecord[] }> = {
  name: "builds",
  describe: "List imported graph builds.",
  mcpTool: "list_graph_builds",

  run: async (_input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.listGraphBuilds(workspaceId);
  },

  renderHuman: ({ builds }) => {
    if (builds.length === 0) {
      console.log("No graph builds. Run: mnotes graph import <graph.json>");
      return;
    }
    for (const b of builds) {
      console.log(
        `${b.id}  ${b.name}  ${b.stats.nodes}n/${b.stats.edges}e  ${b.commitSha ?? "-"}  ${b.createdAt}`,
      );
    }
  },
};
