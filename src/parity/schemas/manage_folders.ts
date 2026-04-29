import { z } from "zod";

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
const folderRecordSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
    isRoot: z.boolean(),
    // Forbid the delete-branch discriminator on this branch. Without this,
    // Zod's `z.union` would accept a payload that satisfies both shapes.
    deleted: z.never().optional(),
  })
  .passthrough();

const folderDeletedSchema = z
  .object({ deleted: z.string() })
  .strict();

export const manageFoldersResponseSchema = z.union([
  folderRecordSchema,
  folderDeletedSchema,
]);

export type ManageFoldersResponse = z.infer<typeof manageFoldersResponseSchema>;
