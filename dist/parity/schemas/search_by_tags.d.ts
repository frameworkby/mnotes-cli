import { z } from "zod";
/**
 * Shared schema for `search_by_tags` MCP tool ⇄ `mnotes folder search-tags --json`.
 * Top-level array, same as `get_recent_notes`. Folder name may be null when
 * the underlying folder lacks a name in the join.
 */
export declare const taggedNoteItemSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    folder: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string | null;
    }, {
        id: string;
        name: string | null;
    }>>;
    updatedAt: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    title: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    folder: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string | null;
    }, {
        id: string;
        name: string | null;
    }>>;
    updatedAt: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    title: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    folder: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string | null;
    }, {
        id: string;
        name: string | null;
    }>>;
    updatedAt: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const searchByTagsResponseSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    folder: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string | null;
    }, {
        id: string;
        name: string | null;
    }>>;
    updatedAt: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    title: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    folder: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string | null;
    }, {
        id: string;
        name: string | null;
    }>>;
    updatedAt: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    title: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    folder: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string | null;
    }, {
        id: string;
        name: string | null;
    }>>;
    updatedAt: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, "many">;
export type SearchByTagsResponse = z.infer<typeof searchByTagsResponseSchema>;
