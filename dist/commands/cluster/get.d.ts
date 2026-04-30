import type { ActionDescriptor } from "../_register-group";
import type { ClusterResult } from "../../client";
interface GetClustersInput {
    workspaceId?: string;
}
export declare const getClustersAction: ActionDescriptor<GetClustersInput, ClusterResult>;
export {};
