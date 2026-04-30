import { z } from "zod";
/**
 * Shared schema for `upload_file` MCP tool ⇄ `mnotes file upload --json`.
 * The `warning` field is present only on partial-success (file uploaded but
 * note linkage failed); the parity contract permits it via `.optional()`.
 */
export declare const uploadFileResponseSchema: z.ZodObject<{
    embed: z.ZodString;
    fileUrl: z.ZodString;
    key: z.ZodString;
    warning: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    embed: z.ZodString;
    fileUrl: z.ZodString;
    key: z.ZodString;
    warning: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    embed: z.ZodString;
    fileUrl: z.ZodString;
    key: z.ZodString;
    warning: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export type UploadFileResponse = z.infer<typeof uploadFileResponseSchema>;
