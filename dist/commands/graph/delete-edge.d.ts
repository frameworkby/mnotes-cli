import type { ActionDescriptor } from "../_register-group";
import type { DeleteGraphEntityResult } from "../../client";
interface DeleteEdgeInput {
    id: string;
}
export declare const deleteEdgeAction: ActionDescriptor<DeleteEdgeInput, DeleteGraphEntityResult>;
export {};
