import type { ActionDescriptor } from "../_register-group";
import type { BulkOpResult } from "../../client";
interface Input {
    noteIds: string;
    targetFolderId: string;
    workspaceId?: string;
}
export declare const bulkMoveAction: ActionDescriptor<Input, BulkOpResult>;
export {};
