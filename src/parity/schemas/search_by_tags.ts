import { z } from "zod";

/**
 * Shared schema for `search_by_tags` MCP tool ⇄ `mnotes folder search-tags --json`.
 * Top-level array, same as `get_recent_notes`. Folder name may be null when
 * the underlying folder lacks a name in the join.
 */
export const taggedNoteItemSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    tags: z.array(z.string()),
    folder: z
      .object({
        id: z.string(),
        name: z.string().nullable(),
      })
      .nullable(),
    // MCP transport is JSON, so timestamps are always strings on the wire.
    updatedAt: z.string(),
  })
  .passthrough();

export const searchByTagsResponseSchema = z.array(taggedNoteItemSchema);

export type SearchByTagsResponse = z.infer<typeof searchByTagsResponseSchema>;
