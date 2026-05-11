import type { ActionDescriptor } from "../_register-group";
import type { KnowledgeStoreResult } from "../../client";
interface StoreInput {
    key: string;
    content: string;
    source?: string;
    confidence?: number;
    tags?: string;
}
export declare const storeAction: ActionDescriptor<StoreInput, KnowledgeStoreResult>;
export {};
