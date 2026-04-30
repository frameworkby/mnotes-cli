import { z } from "zod";
/**
 * Shared schema for the `list_notes` MCP tool response and the matching
 * `mnotes note list --json` output. Both must `parse` cleanly against this
 * shape; the parity harness asserts the equivalence.
 *
 * Keep this schema permissive on individual note fields (extra columns are
 * fine) but strict on the top-level envelope: `notes` array + `nextCursor`.
 */
export declare const listNotesItemSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    folderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    title: z.ZodString;
    folderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    title: z.ZodString;
    folderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, z.ZodTypeAny, "passthrough">>;
export declare const listNotesResponseSchema: z.ZodObject<{
    notes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        folderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        type: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        title: z.ZodString;
        folderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        type: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        title: z.ZodString;
        folderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        type: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    nextCursor: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes: z.objectOutputType<{
        id: z.ZodString;
        title: z.ZodString;
        folderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        type: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    }, z.ZodTypeAny, "passthrough">[];
    nextCursor: string | null;
}, {
    notes: z.objectInputType<{
        id: z.ZodString;
        title: z.ZodString;
        folderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        type: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    }, z.ZodTypeAny, "passthrough">[];
    nextCursor: string | null;
}>;
export type ListNotesResponse = z.infer<typeof listNotesResponseSchema>;
