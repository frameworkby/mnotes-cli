import { z } from "zod";

/** Shared schema for `get_workspace_summary` MCP tool ⇄ `mnotes folder summary --json`. */
const folderTreeNodeBase = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  isRoot: z.boolean(),
  noteCount: z.number().int().nonnegative(),
});

// `folderTree` is a recursive structure; describe it loosely (passthrough)
// to avoid coupling to its exact recursive shape across versions.
const folderTreeNode: z.ZodType<unknown> = folderTreeNodeBase
  .extend({ children: z.array(z.lazy(() => folderTreeNode)).optional() })
  .passthrough();

export const getWorkspaceSummaryResponseSchema = z
  .object({
    totalNotes: z.number().int().nonnegative(),
    totalFolders: z.number().int().nonnegative(),
    folderTree: z.array(folderTreeNode),
    recentActivity: z.array(
      z
        .object({
          id: z.string(),
          title: z.string(),
          // MCP transport is JSON, so timestamps are always strings on the wire.
          updatedAt: z.string(),
        })
        .passthrough(),
    ),
    tagCloud: z.array(
      z.object({
        name: z.string(),
        count: z.number().int().nonnegative(),
      }),
    ),
    noteTypes: z.record(z.string(), z.number().int().nonnegative()),
  })
  .passthrough();

export type GetWorkspaceSummaryResponse = z.infer<
  typeof getWorkspaceSummaryResponseSchema
>;
