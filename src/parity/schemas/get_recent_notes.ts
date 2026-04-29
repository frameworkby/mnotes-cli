import { z } from "zod";

/**
 * Shared schema for `get_recent_notes` MCP tool ⇄ `mnotes folder recent --json`.
 * Note: response envelope is a top-level array (not `{ notes: [...] }`) — this
 * matches both the MCP tool and the v1 HTTP endpoint.
 */
export const recentNoteItemSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    // MCP transport is JSON, so timestamps are always strings on the wire.
    updatedAt: z.string(),
    createdAt: z.string(),
    tags: z.array(z.string()),
    folder: z
      .object({ id: z.string(), name: z.string() })
      .nullable(),
  })
  .passthrough();

export const getRecentNotesResponseSchema = z.array(recentNoteItemSchema);

export type GetRecentNotesResponse = z.infer<typeof getRecentNotesResponseSchema>;
