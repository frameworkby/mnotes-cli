import type { ActionDescriptor } from "../_register-group";
import type { GraphResult } from "../../client";
interface NeighborsInput {
    workspaceId?: string;
    nodeId: string;
    depth?: number;
    edgeType?: string;
}
export declare const neighborsAction: ActionDescriptor<NeighborsInput, GraphResult>;
export {};
