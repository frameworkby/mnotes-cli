import type { ActionDescriptor } from "../_register-group";
import type { GraphResult } from "../../client";
interface GetInput {
    workspaceId?: string;
    query?: string;
    nodeType?: string;
    limit?: number;
}
export declare const getGraphAction: ActionDescriptor<GetInput, GraphResult>;
export {};
