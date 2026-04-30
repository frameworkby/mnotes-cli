import { z } from "zod";
export declare const manageFoldersResponseSchema: z.ZodUnion<[z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    parentId: z.ZodNullable<z.ZodString>;
    isRoot: z.ZodBoolean;
    deleted: z.ZodOptional<z.ZodNever>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    name: z.ZodString;
    parentId: z.ZodNullable<z.ZodString>;
    isRoot: z.ZodBoolean;
    deleted: z.ZodOptional<z.ZodNever>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    name: z.ZodString;
    parentId: z.ZodNullable<z.ZodString>;
    isRoot: z.ZodBoolean;
    deleted: z.ZodOptional<z.ZodNever>;
}, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
    deleted: z.ZodString;
}, "strict", z.ZodTypeAny, {
    deleted: string;
}, {
    deleted: string;
}>]>;
export type ManageFoldersResponse = z.infer<typeof manageFoldersResponseSchema>;
