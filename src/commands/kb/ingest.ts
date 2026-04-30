import { readFileSync } from "node:fs";
import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { KnowledgeIngestEntry, KnowledgeIngestRow } from "../../client";

interface IngestInput {
  file?: string;
  entries?: string;
  workspaceId?: string;
}

export const ingestAction: ActionDescriptor<IngestInput, KnowledgeIngestRow[]> = {
  name: "ingest",
  describe:
    "Batch-import multiple knowledge entries in one call (max 50). Each entry is upserted by key — created if new, updated if the key already exists. All entries are validated before any writes; if any entry is invalid the entire batch is rejected.",
  mcpTool: "knowledge_ingest",
  args: (cmd: Command) =>
    cmd
      .option(
        "--file <path>",
        "Path to a JSON file containing the entries array",
      )
      .option(
        "--entries <json>",
        "Inline JSON array of entries (alternative to --file)",
      )
      .option("--workspace-id <id>", "Workspace ID"),

  run: async (input, ctx) => {
    if (!input.file && !input.entries) {
      throw new Error("--file or --entries is required");
    }
    if (input.file && input.entries) {
      throw new Error("--file and --entries are mutually exclusive");
    }
    const raw = input.file
      ? readFileSync(input.file, "utf8")
      : (input.entries as string);
    let entries: KnowledgeIngestEntry[];
    try {
      entries = JSON.parse(raw) as KnowledgeIngestEntry[];
    } catch (err) {
      throw new Error(
        `Invalid JSON in entries: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    if (!Array.isArray(entries)) {
      throw new Error("Entries must be a JSON array");
    }
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.knowledgeIngest({ entries, workspaceId });
  },
};
