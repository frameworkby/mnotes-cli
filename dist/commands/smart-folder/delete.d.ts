import type { ActionDescriptor } from "../_register-group";
import type { SmartFolderDeleteResult } from "../../client";
interface DeleteSmartFolderInput {
    id: string;
}
export declare const deleteSmartFolderAction: ActionDescriptor<DeleteSmartFolderInput, SmartFolderDeleteResult>;
export {};
