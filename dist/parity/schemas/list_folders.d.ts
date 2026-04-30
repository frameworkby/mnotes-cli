import { z } from "zod";
/** Shared schema for `list_folders` MCP tool ⇄ `mnotes folder list --json`. */
export declare const listFoldersItemSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    parentId: z.ZodNullable<z.ZodString>;
    isRoot: z.ZodBoolean;
    noteCount: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    name: z.ZodString;
    parentId: z.ZodNullable<z.ZodString>;
    isRoot: z.ZodBoolean;
    noteCount: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    name: z.ZodString;
    parentId: z.ZodNullable<z.ZodString>;
    isRoot: z.ZodBoolean;
    noteCount: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const listFoldersResponseSchema: z.ZodObject<{
    folders: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        parentId: z.ZodNullable<z.ZodString>;
        isRoot: z.ZodBoolean;
        noteCount: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        name: z.ZodString;
        parentId: z.ZodNullable<z.ZodString>;
        isRoot: z.ZodBoolean;
        noteCount: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        name: z.ZodString;
        parentId: z.ZodNullable<z.ZodString>;
        isRoot: z.ZodBoolean;
        noteCount: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    nextCursor: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    nextCursor: string | null;
    folders: z.objectOutputType<{
        id: z.ZodString;
        name: z.ZodString;
        parentId: z.ZodNullable<z.ZodString>;
        isRoot: z.ZodBoolean;
        noteCount: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">[];
}, {
    nextCursor: string | null;
    folders: z.objectInputType<{
        id: z.ZodString;
        name: z.ZodString;
        parentId: z.ZodNullable<z.ZodString>;
        isRoot: z.ZodBoolean;
        noteCount: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">[];
}>;
export type ListFoldersResponse = z.infer<typeof listFoldersResponseSchema>;
