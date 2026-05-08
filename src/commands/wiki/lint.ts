import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { WikiLintCheck, WikiLintResult } from "../../client";

interface LintInput {
  checks?: string;
  limit?: string;
  json?: boolean;
}

const VALID_CHECKS: readonly WikiLintCheck[] = [
  "orphans",
  "broken-wikilinks",
  "contradictions",
  "stale",
];

function parseChecksCsv(csv: string): WikiLintCheck[] {
  const parts = csv
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const p of parts) {
    if (!(VALID_CHECKS as readonly string[]).includes(p)) {
      throw new Error(
        `Invalid check '${p}'. Valid: ${VALID_CHECKS.join(", ")}`,
      );
    }
  }
  return parts as WikiLintCheck[];
}

function renderHuman(out: WikiLintResult): void {
  const t = out.summary.totals;
  process.stdout.write(
    `wiki lint — orphans=${t.orphans} broken=${t.brokenWikilinks} contradictions=${t.contradictions} stale=${t.stale}\n`,
  );

  const section = (label: string, rows: string[]): void => {
    if (rows.length === 0) return;
    process.stdout.write(`\n${label}:\n`);
    for (const r of rows.slice(0, 10)) process.stdout.write(`  ${r}\n`);
    if (rows.length > 10) {
      process.stdout.write(`  … +${rows.length - 10} more\n`);
    }
  };

  section(
    "orphans",
    out.orphans.map((o) => `${o.title} (${o.id})`),
  );
  section(
    "broken-wikilinks",
    out.brokenWikilinks.map(
      (b) => `${b.noteTitle} → [[${b.target}]] (no match)`,
    ),
  );
  section(
    "contradictions",
    out.contradictions.map(
      (c) =>
        `${c.noteA.title ?? c.noteA.id} ⟷ ${c.noteB.title ?? c.noteB.id} (sim=${c.similarity.toFixed(2)})`,
    ),
  );
  section(
    "stale",
    out.stale.map(
      (s) =>
        `${s.title} (updated ${s.updatedAt.slice(0, 10)}) — referenced by ${s.referencedBy.title}`,
    ),
  );
}

export const lintAction: ActionDescriptor<LintInput, WikiLintResult> = {
  name: "lint",
  describe:
    "Run all wiki-health checks (orphans, broken-wikilinks, contradictions, stale) in one call. Use --checks to subset.",
  mcpTool: "wiki_lint",
  args: (cmd: Command) =>
    cmd
      .option(
        "--checks <csv>",
        "Comma-separated subset of: orphans,broken-wikilinks,contradictions,stale",
      )
      .option(
        "--limit <n>",
        "Max rows per check (default 100, max 500)",
      )
      .option("--json", "Emit full JSON envelope"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);

    const checks = input.checks ? parseChecksCsv(input.checks) : undefined;
    let limitPerCheck: number | undefined;
    if (input.limit !== undefined) {
      const n = Number(input.limit);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 500) {
        throw new Error("--limit must be an integer between 1 and 500");
      }
      limitPerCheck = n;
    }

    return client.wikiLint({ workspaceId, checks, limitPerCheck });
  },

  renderHuman,
};
