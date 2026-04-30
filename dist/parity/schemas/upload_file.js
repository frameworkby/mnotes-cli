"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileResponseSchema = void 0;
const zod_1 = require("zod");
/**
 * Shared schema for `upload_file` MCP tool ⇄ `mnotes file upload --json`.
 * The `warning` field is present only on partial-success (file uploaded but
 * note linkage failed); the parity contract permits it via `.optional()`.
 */
exports.uploadFileResponseSchema = zod_1.z
    .object({
    embed: zod_1.z.string(),
    fileUrl: zod_1.z.string(),
    key: zod_1.z.string(),
    warning: zod_1.z.string().optional(),
})
    .passthrough();
