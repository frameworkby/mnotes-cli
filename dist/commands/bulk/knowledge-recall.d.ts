import type { ActionDescriptor } from "../_register-group";
import type { BulkKnowledgeRecallResult } from "../../client";
interface Input {
    queries: string;
    limit?: number;
}
export declare const bulkKnowledgeRecallAction: ActionDescriptor<Input, BulkKnowledgeRecallResult>;
export {};
