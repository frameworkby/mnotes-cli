import type { ActionDescriptor } from "../_register-group";
import type { BulkOpResult } from "../../client";
interface Input {
    noteIds: string;
    workspaceId?: string;
}
export declare const bulkArchiveAction: ActionDescriptor<Input, BulkOpResult>;
export {};
