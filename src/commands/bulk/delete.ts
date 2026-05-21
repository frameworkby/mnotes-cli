import * as fs from "fs";
import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

/**
 * Parse newline-delimited note IDs from a file's raw content.
 * Splits on LF, trims each line (which strips trailing CR for CRLF inputs
 * produced on Windows), and drops empty lines.
 */
export function parseNoteIdsFromFile(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface BulkDeleteResult {
  totalRequested: number;
  deleted: string[];
  failed: Array<{ id: string; error: string }>;
}

interface Input {
  noteIds?: string;
  noteIdsFile?: string;
  dryRun?: boolean;
  force?: boolean;
}

export const bulkDeleteAction: ActionDescriptor<Input, BulkDeleteResult> = {
  name: "delete",
  describe:
    "Delete multiple notes by ID. Requires --force (or --dry-run to preview). Per-ID failures are reported without aborting the batch.",
  mcpTool: "bulk_delete",
  args: (cmd: Command) =>
    cmd
      .option("--note-ids <csv>", "Comma-separated note IDs (1-100)")
      .option("--note-ids-file <path>", "Path to file with one note ID per line")
      .option("--dry-run", "Preview which notes would be deleted without mutating")
      .option("--force", "Confirm destructive deletion (required unless --dry-run)"),

  run: async (input, ctx) => {
    // ── Validate flags ────────────────────────────────────────────────────────
    const hasCsv = Boolean(input.noteIds?.trim());
    const hasFile = Boolean(input.noteIdsFile?.trim());

    if (!hasCsv && !hasFile) {
      throw new Error(
        "Provide note IDs via --note-ids <csv> or --note-ids-file <path>.",
      );
    }
    if (hasCsv && hasFile) {
      throw new Error(
        "--note-ids and --note-ids-file are mutually exclusive. Use one.",
      );
    }
    if (!input.dryRun && !input.force) {
      throw new Error(
        "--force is required for deletion. Use --dry-run to preview without mutating.",
      );
    }

    // ── Collect IDs ───────────────────────────────────────────────────────────
    let noteIds: string[];

    if (hasCsv) {
      noteIds = input.noteIds!
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      const raw = fs.readFileSync(input.noteIdsFile!, "utf-8");
      noteIds = parseNoteIdsFromFile(raw);
    }

    if (noteIds.length === 0) {
      throw new Error("No note IDs found. Provide at least one ID.");
    }

    // ── Workspace resolution ──────────────────────────────────────────────────
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }

    // ── Dry-run: no mutation ──────────────────────────────────────────────────
    if (input.dryRun) {
      return {
        totalRequested: noteIds.length,
        deleted: [],
        failed: [],
        dryRunTargets: noteIds,
      } as unknown as BulkDeleteResult & { dryRunTargets: string[] };
    }

    // ── Live delete loop ──────────────────────────────────────────────────────
    const client = createClient(config.baseUrl, config.apiKey);
    const deleted: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const id of noteIds) {
      try {
        await client.deleteNote(id);
        deleted.push(id);
      } catch (err) {
        failed.push({
          id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const result: BulkDeleteResult = {
      totalRequested: noteIds.length,
      deleted,
      failed,
    };

    // Non-zero exit on any failure — set after return via process.exitCode so
    // renderHuman still runs.
    if (failed.length > 0) {
      process.exitCode = 1;
    }

    return result;
  },

  renderHuman: (output) => {
    // Handle dry-run output (extra field attached at runtime)
    const ext = output as BulkDeleteResult & { dryRunTargets?: string[] };
    if (ext.dryRunTargets) {
      process.stdout.write(
        `Dry run — would delete ${ext.dryRunTargets.length} note(s):\n`,
      );
      for (const id of ext.dryRunTargets) {
        process.stdout.write(`  ${id}\n`);
      }
      return;
    }

    process.stdout.write(
      `Deleted ${output.deleted.length} / ${output.totalRequested} note(s).\n`,
    );

    if (output.failed.length > 0) {
      process.stderr.write(`\nFailed (${output.failed.length}):\n`);
      for (const f of output.failed) {
        process.stderr.write(`  ${f.id}: ${f.error}\n`);
      }
    }
  },
};
