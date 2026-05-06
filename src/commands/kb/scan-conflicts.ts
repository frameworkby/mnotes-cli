import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { ScanConflictsResult } from "../../client";

interface ScanConflictsInput {
  similarityThreshold?: number;
  pairCap?: number;
  tags?: string;
}

export const scanConflictsAction: ActionDescriptor<
  ScanConflictsInput,
  ScanConflictsResult
> = {
  name: "scan-conflicts",
  describe:
    "Kick off a background scan to detect conflicting/overlapping knowledge entries. Returns a scan ID and the estimated number of pairs to be analysed.",
  mcpTool: "scan_knowledge_conflicts",
  args: (cmd: Command) =>
    cmd
      .option(
        "--similarity-threshold <n>",
        "Minimum similarity 0.0–1.0 to consider a pair",
        (v) => parseFloat(v),
      )
      .option("--pair-cap <n>", "Maximum pairs to analyse", (v) =>
        parseInt(v, 10),
      )
      .option("--tags <csv>", "Comma-separated tags filter"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const tags = input.tags
      ? input.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : undefined;
    const client = createClient(config.baseUrl, config.apiKey);
    return client.scanKnowledgeConflicts({
      workspaceId,
      similarityThreshold: input.similarityThreshold,
      pairCap: input.pairCap,
      tags,
    });
  },
};
