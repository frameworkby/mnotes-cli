import type { ActionDescriptor } from "../_register-group";
import type { GraphTraverseResult } from "../../client";
interface TraverseInput {
    startNodeId: string;
    maxDepth?: number;
    edgeTypes?: string;
    nodeTypes?: string;
}
export declare const traverseAction: ActionDescriptor<TraverseInput, GraphTraverseResult>;
export {};
