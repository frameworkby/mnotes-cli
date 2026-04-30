"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNotesResponseSchema = exports.listNotesItemSchema = void 0;
const zod_1 = require("zod");
/**
 * Shared schema for the `list_notes` MCP tool response and the matching
 * `mnotes note list --json` output. Both must `parse` cleanly against this
 * shape; the parity harness asserts the equivalence.
 *
 * Keep this schema permissive on individual note fields (extra columns are
 * fine) but strict on the top-level envelope: `notes` array + `nextCursor`.
 */
exports.listNotesItemSchema = zod_1.z
    .object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    folderId: zod_1.z.string().nullable().optional(),
    type: zod_1.z.string().optional(),
    updatedAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
})
    .passthrough();
exports.listNotesResponseSchema = zod_1.z.object({
    notes: zod_1.z.array(exports.listNotesItemSchema),
    nextCursor: zod_1.z.string().nullable(),
});
