"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentNotesResponseSchema = exports.recentNoteItemSchema = void 0;
const zod_1 = require("zod");
/**
 * Shared schema for `get_recent_notes` MCP tool ⇄ `mnotes folder recent --json`.
 * Note: response envelope is a top-level array (not `{ notes: [...] }`) — this
 * matches both the MCP tool and the v1 HTTP endpoint.
 */
exports.recentNoteItemSchema = zod_1.z
    .object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    // MCP transport is JSON, so timestamps are always strings on the wire.
    updatedAt: zod_1.z.string(),
    createdAt: zod_1.z.string(),
    tags: zod_1.z.array(zod_1.z.string()),
    folder: zod_1.z
        .object({ id: zod_1.z.string(), name: zod_1.z.string() })
        .nullable(),
})
    .passthrough();
exports.getRecentNotesResponseSchema = zod_1.z.array(exports.recentNoteItemSchema);
