import type { Command } from "commander";
import { readFileSync, statSync } from "node:fs";
import { basename } from "node:path";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { UploadResult } from "../../client";

// Match server cap (src/app/api/v1/files/route.ts: MAX_FILE_SIZE). Reject
// oversized files locally before reading + base64-inflating.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Match server schema (filename trimmed, 1–255 chars).
const MAX_FILENAME_LEN = 255;

interface UploadInput {
  // One of --path or --content is required.
  path?: string;
  content?: string;
  filename?: string;
  mimeType: string;
  noteId?: string;
}

export const uploadFileAction: ActionDescriptor<UploadInput, UploadResult> = {
  name: "upload",
  // Mirrored verbatim from MCP `upload_file` description.
  describe:
    "Upload a file (image or PDF) to storage. Returns a markdown embed. If noteId is provided, the embed is appended to the note content.",
  mcpTool: "upload_file",
  args: (cmd: Command) =>
    cmd
      .option(
        "--path <path>",
        "Path to local file (preferred — content read and base64-encoded)",
      )
      .option(
        "--content <base64>",
        "File content already encoded as base64 (alternative to --path)",
      )
      .option(
        "--filename <name>",
        "Original filename (defaults to basename of --path)",
      )
      .requiredOption(
        "--mime-type <type>",
        "MIME type (image/jpeg, image/png, image/gif, image/webp, application/pdf)",
      )
      .option("--note-id <id>", "If provided, append the embed to this note"),

  run: async (input, ctx) => {
    if (!input.path && !input.content) {
      throw new Error("--path or --content is required");
    }
    if (input.path && input.content) {
      throw new Error("--path and --content are mutually exclusive");
    }

    let filename: string;
    let content: string;
    if (input.path) {
      // Pre-flight size check so we reject oversized files before the
      // readFileSync + base64 inflation (server cap is 10 MB raw).
      const stats = statSync(input.path);
      if (stats.size > MAX_UPLOAD_BYTES) {
        const mb = Math.round(stats.size / 1024 / 1024);
        throw new Error(
          `File too large (${mb}MB). Maximum: 10MB`,
        );
      }
      const buf = readFileSync(input.path);
      content = buf.toString("base64");
      filename = input.filename ?? basename(input.path);
    } else {
      content = input.content!;
      if (!input.filename) {
        throw new Error("--filename is required when using --content");
      }
      filename = input.filename;
    }

    // Match server validation: trim and bound filename length so we fail with
    // a clear local error instead of bouncing off a 400 from the API.
    filename = filename.trim();
    if (filename.length === 0) {
      throw new Error("--filename must not be empty after trimming");
    }
    if (filename.length > MAX_FILENAME_LEN) {
      throw new Error(
        `--filename too long (${filename.length} chars). Maximum: ${MAX_FILENAME_LEN}`,
      );
    }

    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);
    return client.uploadFile({
      filename,
      content,
      mimeType: input.mimeType,
      noteId: input.noteId,
    });
  },
};
