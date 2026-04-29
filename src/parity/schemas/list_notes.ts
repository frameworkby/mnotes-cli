import { z } from "zod";

/**
 * Shared schema for the `list_notes` MCP tool response and the matching
 * `mnotes note list --json` output. Both must `parse` cleanly against this
 * shape; the parity harness asserts the equivalence.
 *
 * Keep this schema permissive on individual note fields (extra columns are
 * fine) but strict on the top-level envelope: `notes` array + `nextCursor`.
 */
export const listNotesItemSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    folderId: z.string().nullable().optional(),
    type: z.string().optional(),
    updatedAt: z.union([z.string(), z.date()]),
  })
  .passthrough();

export const listNotesResponseSchema = z.object({
  notes: z.array(listNotesItemSchema),
  nextCursor: z.string().nullable(),
});

export type ListNotesResponse = z.infer<typeof listNotesResponseSchema>;
