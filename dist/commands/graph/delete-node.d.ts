import type { ActionDescriptor } from "../_register-group";
import type { DeleteGraphEntityResult } from "../../client";
interface DeleteNodeInput {
    id: string;
    workspaceId?: string;
}
export declare const deleteNodeAction: ActionDescriptor<DeleteNodeInput, DeleteGraphEntityResult>;
export {};
