import type { ActionDescriptor } from "../_register-group";
import type { FolderListItem } from "../../client";
interface ListInput {
    cursor?: string;
    limit?: number;
}
interface ListOutput {
    folders: FolderListItem[];
    nextCursor: string | null;
}
export declare const listFoldersAction: ActionDescriptor<ListInput, ListOutput>;
export {};
