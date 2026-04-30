import type { ActionDescriptor } from "../_register-group";
import type { FindPathResult } from "../../client";
interface FindPathInput {
    workspaceId?: string;
    fromNodeId: string;
    toNodeId: string;
    maxDepth?: number;
}
export declare const findPathAction: ActionDescriptor<FindPathInput, FindPathResult>;
export {};
