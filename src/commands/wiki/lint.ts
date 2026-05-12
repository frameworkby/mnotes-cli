import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { WikiLintCheck, WikiLintOrphan, WikiLintResult } from "../../client";

// System-generated notes that can never have inbound links by design.
// Used as a client-side post-filter unless --include-system is passed.
export const SYSTEM_NOTE_TITLES = ["Wiki Activity Log", "Wiki Index"] as const;

interface LintInput {
  checks?: string;
  limit?: string;
  json?: boolean;
  includeArchived?: boolean;
  includeSystem?: boolean;
  notesOnly?: boolean;
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

/**
 * Post-filter all lint categories to exclude kb entries (notes with a key)
 * when --notes-only is passed. Recomputes all summary totals.
 */
export function filterNotesOnly(result: WikiLintResult): WikiLintResult {
  const orphans = result.orphans.filter((o) => !o.isKb);
  const brokenWikilinks = result.brokenWikilinks.filter((b) => !b.isKb);
  const contradictions = result.contradictions.filter(
    (c) => !c.noteA.isKb && !c.noteB.isKb,
  );
  const stale = result.stale.filter((s) => !s.isKb);

  if (
    orphans.length === result.orphans.length &&
    brokenWikilinks.length === result.brokenWikilinks.length &&
    contradictions.length === result.contradictions.length &&
    stale.length === result.stale.length
  ) {
    return result;
  }

  return {
    ...result,
    orphans,
    brokenWikilinks,
    contradictions,
    stale,
    summary: {
      ...result.summary,
      totals: {
        orphans: orphans.length,
        brokenWikilinks: brokenWikilinks.length,
        contradictions: contradictions.length,
        stale: stale.length,
      },
    },
  };
}

/**
 * Post-filter orphan list based on --include-archived and --include-system flags.
 * Recomputes the orphan total to match the displayed list.
 */
export function filterOrphans(
  result: WikiLintResult,
  includeArchived: boolean,
  includeSystem: boolean,
): WikiLintResult {
  let orphans: WikiLintOrphan[] = result.orphans;

  if (!includeArchived) {
    orphans = orphans.filter((o) => !o.archived);
  }

  if (!includeSystem) {
    const systemTitles = new Set<string>(SYSTEM_NOTE_TITLES);
    orphans = orphans.filter((o) => !systemTitles.has(o.title));
  }

  if (orphans.length === result.orphans.length) {
    return result;
  }

  return {
    ...result,
    orphans,
    summary: {
      ...result.summary,
      totals: {
        ...result.summary.totals,
        orphans: orphans.length,
      },
    },
  };
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
    "Run all wiki-health checks (orphans, broken-wikilinks, contradictions, stale) in one call. " +
    "Use --checks to subset. By default, archived notes and system-generated notes (Wiki Activity Log, Wiki Index) " +
    "are excluded from the orphans list. Pass --include-archived or --include-system to opt back in. " +
    "Pass --notes-only to exclude kb entries (notes with a key) from all lint categories.",
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
      .option("--json", "Emit full JSON envelope")
      .option(
        "--include-archived",
        "Include archived notes in the orphans list (excluded by default)",
      )
      .option(
        "--include-system",
        "Include system-generated notes (Wiki Activity Log, Wiki Index) in the orphans list (excluded by default)",
      )
      .option(
        "--notes-only",
        "Exclude kb entries (notes with a key) from all lint categories",
      ),

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

    const raw = await client.wikiLint({ workspaceId, checks, limitPerCheck });
    const afterOrphans = filterOrphans(raw, input.includeArchived ?? false, input.includeSystem ?? false);
    return input.notesOnly ? filterNotesOnly(afterOrphans) : afterOrphans;
  },

  renderHuman,
};
