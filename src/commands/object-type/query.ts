import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { QueryByTypeResult } from "../../client";

interface Input {
  type: string;
  limit?: number;
  propertyFilters?: string;
  workspaceId?: string;
}

export const queryByTypeAction: ActionDescriptor<Input, QueryByTypeResult> = {
  name: "query",
  describe:
    "Query notes by object type. Optionally filter by property values (JSON object). Returns note id, title, objectTypeId, and properties.",
  mcpTool: "query_by_type",
  positional: ["type"],
  args: (cmd: Command) =>
    cmd
      .argument("<type>", "Object type ID")
      .option("--limit <n>", "Max notes to return (default 50, max 100)", (v) =>
        parseInt(v, 10),
      )
      .option(
        "--property-filters <json>",
        "JSON object string for property equality filters",
      )
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.queryByType(input.type, {
      workspaceId,
      limit: input.limit,
      propertyFilters: input.propertyFilters,
    });
  },
};
