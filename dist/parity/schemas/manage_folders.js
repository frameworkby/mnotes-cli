"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manageFoldersResponseSchema = void 0;
const zod_1 = require("zod");
/**
 * `manage_folders` is action-overloaded; its response shape depends on the
 * action: create/rename return a folder record, delete returns `{ deleted }`.
 *
 * Each branch is strict on the keys that distinguish it. The folder-record
 * branch requires `id`, `name`, `parentId`, `isRoot` (always present in the
 * API response) and explicitly forbids the `deleted` key, so a payload that
 * happens to satisfy both shapes can't slip through ambiguously. The delete
 * branch is exact: only `{ deleted: string }`.
 */
const folderRecordSchema = zod_1.z
    .object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    parentId: zod_1.z.string().nullable(),
    isRoot: zod_1.z.boolean(),
    // Forbid the delete-branch discriminator on this branch. Without this,
    // Zod's `z.union` would accept a payload that satisfies both shapes.
    deleted: zod_1.z.never().optional(),
})
    .passthrough();
const folderDeletedSchema = zod_1.z
    .object({ deleted: zod_1.z.string() })
    .strict();
exports.manageFoldersResponseSchema = zod_1.z.union([
    folderRecordSchema,
    folderDeletedSchema,
]);
