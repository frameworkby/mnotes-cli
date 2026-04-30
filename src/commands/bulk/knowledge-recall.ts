import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { BulkKnowledgeRecallResult } from "../../client";

interface Input {
  queries: string;
  limit?: number;
  workspaceId?: string;
}

export const bulkKnowledgeRecallAction: ActionDescriptor<
  Input,
  BulkKnowledgeRecallResult
> = {
  name: "knowledge-recall",
  describe:
    "Recall knowledge entries matching multiple tag patterns in one call. Results are grouped by pattern, sorted by importance then freshness, and deduplicated across groups.",
  mcpTool: "bulk_knowledge_recall",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--queries <csv>", "Comma-separated tag patterns (1-20)")
      .option("--limit <n>", "Max entries per pattern (default 20, max 100)", (v) =>
        parseInt(v, 10),
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
    const queries = input.queries
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (queries.length === 0) {
      throw new Error("--queries must include at least one pattern");
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.bulkKnowledgeRecall({ queries, workspaceId, limit: input.limit });
  },
};
