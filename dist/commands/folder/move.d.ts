import type { ActionDescriptor } from "../_register-group";
import type { FolderRecord } from "../../client";
interface MoveInput {
    id: string;
    parentId?: string;
    root?: boolean;
}
export declare const moveFolderAction: ActionDescriptor<MoveInput, FolderRecord>;
export {};
