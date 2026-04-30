import type { ActionDescriptor } from "../_register-group";
import type { GraphNodeRecord } from "../../client";
interface CreateNodeInput {
    workspaceId?: string;
    label: string;
    nodeType?: "note" | "tag" | "concept";
    noteId?: string;
    metadata?: string;
}
export declare const createNodeAction: ActionDescriptor<CreateNodeInput, GraphNodeRecord>;
export {};
