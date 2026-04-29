import { z } from "zod";

/** Shared schema for `list_folders` MCP tool ⇄ `mnotes folder list --json`. */
export const listFoldersItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
    isRoot: z.boolean(),
    noteCount: z.number().int().nonnegative(),
  })
  .passthrough();

export const listFoldersResponseSchema = z.object({
  folders: z.array(listFoldersItemSchema),
  nextCursor: z.string().nullable(),
});

export type ListFoldersResponse = z.infer<typeof listFoldersResponseSchema>;
