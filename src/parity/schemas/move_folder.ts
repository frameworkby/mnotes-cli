import { z } from "zod";

/** Shared schema for `move_folder` MCP tool ⇄ `mnotes folder move --json`. */
export const moveFolderResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
    isRoot: z.boolean(),
  })
  .passthrough();

export type MoveFolderResponse = z.infer<typeof moveFolderResponseSchema>;
