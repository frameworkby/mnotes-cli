import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { RecallEntry, RelatedTask } from "../../client";
import { printJson, printRelatedTasks } from "../../output";

type RecallOutput = { results: RecallEntry[]; relatedTasks: RelatedTask[] };

interface RecallInput {
  query: string;
  tags?: string;
  limit?: number;
  decayWindow?: number;
}

export const recallAction: ActionDescriptor<RecallInput, RecallOutput> = {
  name: "recall",
  // Mirrored verbatim from MCP `recall_knowledge` description.
  describe:
    "Retrieve knowledge entries ranked by a weighted combination of semantic similarity, importance, and freshness. finalScore = semanticScore * 0.7 + importance * 0.2 + freshnessScore * 0.1. Null importance is treated as 0. Freshness decays linearly over the decay window (default 90 days).",
  mcpTool: "recall_knowledge",
  // Story-mandated backward-compat alias for the legacy flat command. Also
  // honor the underscore form that the previous CLI surface used.
  aliases: ["recall-knowledge", "recall_knowledge"],
  args: (cmd: Command) =>
    cmd
      .requiredOption("--query <text>", "Natural language query")
      .option("--tags <csv>", "Comma-separated tags filter")
      .option("--limit <n>", "Max results (default 10, max 50)", (v) =>
        parseInt(v, 10),
      )
      .option(
        "--decay-window <n>",
        "Days for full freshness decay (default 90)",
        (v) => parseInt(v, 10),
      ),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const tags = input.tags
      ? input.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;
    const client = createClient(config.baseUrl, config.apiKey);
    const apiResp = await client.recallKnowledge({
      query: input.query,
      workspaceId,
      tags,
      limit: input.limit,
    });
    return { results: apiResp.data.results, relatedTasks: apiResp.data.relatedTasks ?? [] };
  },

  // Human mode keeps printing the results array on stdout; the footer goes to stderr.
  renderHuman: (output) => {
    printJson(output.results);
    printRelatedTasks(output.relatedTasks, (line) => process.stderr.write(`${line}\n`));
  },
};
