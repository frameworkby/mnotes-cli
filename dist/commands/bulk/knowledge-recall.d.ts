import type { ActionDescriptor } from "../_register-group";
import type { BulkKnowledgeRecallResult } from "../../client";
interface Input {
    queries: string;
    limit?: number;
    workspaceId?: string;
}
export declare const bulkKnowledgeRecallAction: ActionDescriptor<Input, BulkKnowledgeRecallResult>;
export {};
