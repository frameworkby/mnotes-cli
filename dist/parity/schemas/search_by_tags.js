"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchByTagsResponseSchema = exports.taggedNoteItemSchema = void 0;
const zod_1 = require("zod");
/**
 * Shared schema for `search_by_tags` MCP tool ⇄ `mnotes folder search-tags --json`.
 * Top-level array, same as `get_recent_notes`. Folder name may be null when
 * the underlying folder lacks a name in the join.
 */
exports.taggedNoteItemSchema = zod_1.z
    .object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    tags: zod_1.z.array(zod_1.z.string()),
    folder: zod_1.z
        .object({
        id: zod_1.z.string(),
        name: zod_1.z.string().nullable(),
    })
        .nullable(),
    // MCP transport is JSON, so timestamps are always strings on the wire.
    updatedAt: zod_1.z.string(),
})
    .passthrough();
exports.searchByTagsResponseSchema = zod_1.z.array(exports.taggedNoteItemSchema);
