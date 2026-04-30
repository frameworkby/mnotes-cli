import type { ActionDescriptor } from "../_register-group";
import type { SmartFolder } from "../../client";
interface ListSmartFoldersInput {
    workspaceId?: string;
}
export declare const listSmartFoldersAction: ActionDescriptor<ListSmartFoldersInput, SmartFolder[]>;
export {};
