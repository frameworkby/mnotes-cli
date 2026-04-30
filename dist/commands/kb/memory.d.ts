import type { ActionDescriptor } from "../_register-group";
import type { MemoryUpsertResult } from "../../client";
interface MemoryInput {
    key: string;
    content: string;
    source?: string;
    confidence?: number;
    tags?: string;
    workspaceId?: string;
}
export declare const memoryAction: ActionDescriptor<MemoryInput, MemoryUpsertResult>;
export {};
