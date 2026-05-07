import { readFileSync } from "node:fs";
import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { IngestExternalResult } from "../../client";

const SOURCE_TYPES = [
  "web_page",
  "pdf",
  "email",
  "slack",
  "meeting",
  "other",
] as const;
type SourceType = (typeof SOURCE_TYPES)[number];

interface IngestExternalInput {
  title?: string;
  content?: string;
  contentFile?: string;
  sourceType?: string;
  sourceUrl?: string;
  sourceRef?: string;
  tags?: string;
  folderId?: string;
}

export const ingestExternalAction: ActionDescriptor<
  IngestExternalInput,
  IngestExternalResult
> = {
  name: "ingest-external",
  describe:
    "Ingest external content (web page, PDF, email, slack, meeting, other) into the knowledge base. If --source-url matches an existing note's provenance, the note is updated; otherwise a new note is created. Content is capped at 100KB.",
  mcpTool: "ingest_external",
  args: (cmd: Command) =>
    cmd
      .option("--title <title>", "Note title")
      .option("--content <content>", "Inline content (markdown)")
      .option(
        "--content-file <path>",
        "Path to a file whose contents become the note body",
      )
      .option(
        "--source-type <type>",
        `One of: ${SOURCE_TYPES.join(", ")}`,
      )
      .option("--source-url <url>", "Canonical URL (enables upsert by URL)")
      .option(
        "--source-ref <ref>",
        "Opaque reference (e.g. message ID); never triggers upsert",
      )
      .option("--tags <csv>", "Comma-separated tags")
      .option("--folder-id <id>", "Target folder (defaults to workspace root)"),

  run: async (input, ctx) => {
    if (!input.title) throw new Error("--title is required");
    if (!input.sourceType) throw new Error("--source-type is required");
    if (!SOURCE_TYPES.includes(input.sourceType as SourceType)) {
      throw new Error(
        `Invalid --source-type. Must be one of: ${SOURCE_TYPES.join(", ")}`,
      );
    }
    if (!input.content && !input.contentFile) {
      throw new Error("--content or --content-file is required");
    }
    if (input.content && input.contentFile) {
      throw new Error("--content and --content-file are mutually exclusive");
    }
    if (!input.sourceUrl && !input.sourceRef) {
      throw new Error("--source-url or --source-ref is required");
    }

    const content = input.contentFile
      ? readFileSync(input.contentFile, "utf8")
      : (input.content as string);

    const tags = input.tags
      ? input.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : undefined;

    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.ingestExternal({
      workspaceId,
      title: input.title,
      content,
      sourceType: input.sourceType as SourceType,
      sourceUrl: input.sourceUrl,
      sourceRef: input.sourceRef,
      tags,
      folderId: input.folderId,
    });
  },
};
