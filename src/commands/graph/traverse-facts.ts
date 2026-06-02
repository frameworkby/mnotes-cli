import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { TraverseFactsResult } from "../../client";

interface TraverseFactsInput {
  start: string;
  depth?: number;
  predicates?: string;
  asOf?: string;
}

function csv(value?: string): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const traverseFactsAction: ActionDescriptor<TraverseFactsInput, TraverseFactsResult> = {
  name: "traverse-facts",
  describe:
    "Traverse the bi-temporal fact graph from a start entity (point-in-time), with predicate filters and a max depth.",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--start <entityId>", "Start entity ID")
      .option("--depth <n>", "Max traversal depth (1-3)", (v) => parseInt(v, 10))
      .option("--predicates <csv>", "Comma-separated predicates to include")
      .option("--as-of <ISO>", "Point-in-time as-of date (ISO 8601); defaults to now"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.graphTraverseFacts({
      startEntityId: input.start,
      maxDepth: input.depth,
      predicates: csv(input.predicates),
      asOf: input.asOf,
      workspaceId,
    });
  },

  renderHuman: (output) =>
    console.log(
      `Reached ${output.nodeCount} entities via ${output.edgeCount} facts`,
    ),
};
