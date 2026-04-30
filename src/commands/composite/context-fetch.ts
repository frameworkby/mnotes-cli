import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  query: string;
  limit?: number;
  tokenBudget?: number;
  types?: string;
  tags?: string;
  workspaceId?: string;
}

export const contextFetchAction: ActionDescriptor<Input, unknown> = {
  name: "context-fetch",
  describe:
    "Token-budgeted hybrid retrieval: returns the most relevant notes for a query within a token budget.",
  mcpTool: "context_fetch",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--query <s>", "Search query")
      .option("--limit <n>", "Max items", (v) => parseInt(v, 10))
      .option("--token-budget <n>", "Max tokens to return", (v) => parseInt(v, 10))
      .option("--types <csv>", "Comma-separated note types")
      .option("--tags <csv>", "Comma-separated tags")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const types = input.types
      ? input.types.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const tags = input.tags
      ? input.tags.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const client = createClient(config.baseUrl, config.apiKey);
    return client.contextFetch({
      workspaceId,
      query: input.query,
      limit: input.limit,
      tokenBudget: input.tokenBudget,
      types,
      tags,
    });
  },
};
