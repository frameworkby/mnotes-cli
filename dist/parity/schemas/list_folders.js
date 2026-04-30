"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFoldersResponseSchema = exports.listFoldersItemSchema = void 0;
const zod_1 = require("zod");
/** Shared schema for `list_folders` MCP tool ⇄ `mnotes folder list --json`. */
exports.listFoldersItemSchema = zod_1.z
    .object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    parentId: zod_1.z.string().nullable(),
    isRoot: zod_1.z.boolean(),
    noteCount: zod_1.z.number().int().nonnegative(),
})
    .passthrough();
exports.listFoldersResponseSchema = zod_1.z.object({
    folders: zod_1.z.array(exports.listFoldersItemSchema),
    nextCursor: zod_1.z.string().nullable(),
});
