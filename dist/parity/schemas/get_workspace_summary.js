"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspaceSummaryResponseSchema = void 0;
const zod_1 = require("zod");
/** Shared schema for `get_workspace_summary` MCP tool ⇄ `mnotes folder summary --json`. */
const folderTreeNodeBase = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    parentId: zod_1.z.string().nullable(),
    isRoot: zod_1.z.boolean(),
    noteCount: zod_1.z.number().int().nonnegative(),
});
// `folderTree` is a recursive structure; describe it loosely (passthrough)
// to avoid coupling to its exact recursive shape across versions.
const folderTreeNode = folderTreeNodeBase
    .extend({ children: zod_1.z.array(zod_1.z.lazy(() => folderTreeNode)).optional() })
    .passthrough();
exports.getWorkspaceSummaryResponseSchema = zod_1.z
    .object({
    totalNotes: zod_1.z.number().int().nonnegative(),
    totalFolders: zod_1.z.number().int().nonnegative(),
    folderTree: zod_1.z.array(folderTreeNode),
    recentActivity: zod_1.z.array(zod_1.z
        .object({
        id: zod_1.z.string(),
        title: zod_1.z.string(),
        // MCP transport is JSON, so timestamps are always strings on the wire.
        updatedAt: zod_1.z.string(),
    })
        .passthrough()),
    tagCloud: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        count: zod_1.z.number().int().nonnegative(),
    })),
    noteTypes: zod_1.z.record(zod_1.z.string(), zod_1.z.number().int().nonnegative()),
})
    .passthrough();
