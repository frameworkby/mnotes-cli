import { z } from "zod";
/**
 * Shared schema for `get_recent_notes` MCP tool ⇄ `mnotes folder recent --json`.
 * Note: response envelope is a top-level array (not `{ notes: [...] }`) — this
 * matches both the MCP tool and the v1 HTTP endpoint.
 */
export declare const recentNoteItemSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    updatedAt: z.ZodString;
    createdAt: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    folder: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    title: z.ZodString;
    updatedAt: z.ZodString;
    createdAt: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    folder: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    title: z.ZodString;
    updatedAt: z.ZodString;
    createdAt: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    folder: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const getRecentNotesResponseSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    updatedAt: z.ZodString;
    createdAt: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    folder: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    title: z.ZodString;
    updatedAt: z.ZodString;
    createdAt: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    folder: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    title: z.ZodString;
    updatedAt: z.ZodString;
    createdAt: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    folder: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>>;
}, z.ZodTypeAny, "passthrough">>, "many">;
export type GetRecentNotesResponse = z.infer<typeof getRecentNotesResponseSchema>;
