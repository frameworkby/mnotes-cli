import type { ActionDescriptor } from "../_register-group";
import type { QueryNoteGraphResult } from "../../client";
interface QueryNoteInput {
    noteId: string;
    depth?: number;
}
export declare const queryNoteGraphAction: ActionDescriptor<QueryNoteInput, QueryNoteGraphResult>;
export {};
