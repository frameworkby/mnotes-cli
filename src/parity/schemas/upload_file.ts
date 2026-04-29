import { z } from "zod";

/**
 * Shared schema for `upload_file` MCP tool ⇄ `mnotes file upload --json`.
 * The `warning` field is present only on partial-success (file uploaded but
 * note linkage failed); the parity contract permits it via `.optional()`.
 */
export const uploadFileResponseSchema = z
  .object({
    embed: z.string(),
    fileUrl: z.string(),
    key: z.string(),
    warning: z.string().optional(),
  })
  .passthrough();

export type UploadFileResponse = z.infer<typeof uploadFileResponseSchema>;
