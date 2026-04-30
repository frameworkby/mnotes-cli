"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveFolderResponseSchema = void 0;
const zod_1 = require("zod");
/** Shared schema for `move_folder` MCP tool ⇄ `mnotes folder move --json`. */
exports.moveFolderResponseSchema = zod_1.z
    .object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    parentId: zod_1.z.string().nullable(),
    isRoot: zod_1.z.boolean(),
})
    .passthrough();
