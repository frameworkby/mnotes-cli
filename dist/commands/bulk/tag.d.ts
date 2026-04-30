import type { ActionDescriptor } from "../_register-group";
import type { BulkOpResult } from "../../client";
interface Input {
    noteIds: string;
    tags: string;
    op: "add" | "remove";
    workspaceId?: string;
}
export declare const bulkTagAction: ActionDescriptor<Input, BulkOpResult>;
export {};
