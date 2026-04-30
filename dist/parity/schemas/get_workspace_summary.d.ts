import { z } from "zod";
export declare const getWorkspaceSummaryResponseSchema: z.ZodObject<{
    totalNotes: z.ZodNumber;
    totalFolders: z.ZodNumber;
    folderTree: z.ZodArray<z.ZodType<unknown, z.ZodTypeDef, unknown>, "many">;
    recentActivity: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        updatedAt: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        title: z.ZodString;
        updatedAt: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        title: z.ZodString;
        updatedAt: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    tagCloud: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        count: number;
    }, {
        name: string;
        count: number;
    }>, "many">;
    noteTypes: z.ZodRecord<z.ZodString, z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    totalNotes: z.ZodNumber;
    totalFolders: z.ZodNumber;
    folderTree: z.ZodArray<z.ZodType<unknown, z.ZodTypeDef, unknown>, "many">;
    recentActivity: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        updatedAt: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        title: z.ZodString;
        updatedAt: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        title: z.ZodString;
        updatedAt: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    tagCloud: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        count: number;
    }, {
        name: string;
        count: number;
    }>, "many">;
    noteTypes: z.ZodRecord<z.ZodString, z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    totalNotes: z.ZodNumber;
    totalFolders: z.ZodNumber;
    folderTree: z.ZodArray<z.ZodType<unknown, z.ZodTypeDef, unknown>, "many">;
    recentActivity: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        updatedAt: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        title: z.ZodString;
        updatedAt: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        title: z.ZodString;
        updatedAt: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    tagCloud: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        count: number;
    }, {
        name: string;
        count: number;
    }>, "many">;
    noteTypes: z.ZodRecord<z.ZodString, z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export type GetWorkspaceSummaryResponse = z.infer<typeof getWorkspaceSummaryResponseSchema>;
