import type { ActionDescriptor } from "../_register-group";
import type { BulkOpResult } from "../../client";
interface Input {
    noteIds: string;
}
export declare const bulkArchiveAction: ActionDescriptor<Input, BulkOpResult>;
export {};
