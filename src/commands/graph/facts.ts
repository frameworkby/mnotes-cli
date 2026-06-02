import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { GraphFact } from "../../client";

interface FactsInput {
  subject?: string;
  predicate?: string;
  asOf?: string;
  limit?: number;
}

export const factsAction: ActionDescriptor<FactsInput, GraphFact[]> = {
  name: "facts",
  describe:
    "List current (or point-in-time) facts, optionally filtered by subject entity and/or predicate.",
  args: (cmd: Command) =>
    cmd
      .option("--subject <entityId>", "Filter by subject entity ID")
      .option("--predicate <p>", "Filter by predicate (e.g. works_at)")
      .option("--as-of <ISO>", "Point-in-time as-of date (ISO 8601); defaults to now")
      .option("--limit <n>", "Max facts to return", (v) => parseInt(v, 10)),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.graphFacts({
      workspaceId,
      subjectId: input.subject,
      predicate: input.predicate,
      asOf: input.asOf,
      limit: input.limit,
    });
  },

  renderHuman: (output) => {
    if (output.length === 0) {
      console.log("No facts found.");
      return;
    }
    for (const f of output) {
      console.log(`- ${f.statement}  (${f.predicate}, conf ${f.confidence})`);
    }
  },
};
