import type { ActionDescriptor } from "../_register-group";
import type { GraphResult } from "../../client";
interface QueryInput {
    workspaceId?: string;
    nodeType?: string;
    labelContains?: string;
    edgeType?: string;
    connectedTo?: string;
    depth?: number;
    limit?: number;
}
export declare const queryGraphAction: ActionDescriptor<QueryInput, GraphResult>;
export {};
