import type { ActionDescriptor } from "../_register-group";
import type { NoteListItem } from "../../client";
interface ListInput {
    workspaceId?: string;
    folderId?: string;
    cursor?: string;
    limit?: number;
}
interface ListOutput {
    notes: NoteListItem[];
    nextCursor: string | null;
}
export declare const listAction: ActionDescriptor<ListInput, ListOutput>;
export {};
