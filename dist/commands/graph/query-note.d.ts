import type { ActionDescriptor } from "../_register-group";
import type { QueryNoteGraphResult } from "../../client";
interface QueryNoteInput {
    workspaceId?: string;
    noteId: string;
    depth?: number;
}
export declare const queryNoteGraphAction: ActionDescriptor<QueryNoteInput, QueryNoteGraphResult>;
export {};
