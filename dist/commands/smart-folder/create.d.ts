import type { ActionDescriptor } from "../_register-group";
import type { SmartFolder } from "../../client";
interface CreateSmartFolderInput {
    name: string;
    query: string;
    mode: "fulltext" | "semantic";
    workspaceId?: string;
}
export declare const createSmartFolderAction: ActionDescriptor<CreateSmartFolderInput, SmartFolder>;
export {};
