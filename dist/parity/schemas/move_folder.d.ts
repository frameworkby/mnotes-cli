import { z } from "zod";
/** Shared schema for `move_folder` MCP tool ⇄ `mnotes folder move --json`. */
export declare const moveFolderResponseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    parentId: z.ZodNullable<z.ZodString>;
    isRoot: z.ZodBoolean;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    name: z.ZodString;
    parentId: z.ZodNullable<z.ZodString>;
    isRoot: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    name: z.ZodString;
    parentId: z.ZodNullable<z.ZodString>;
    isRoot: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">>;
export type MoveFolderResponse = z.infer<typeof moveFolderResponseSchema>;
