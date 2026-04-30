import type { ActionDescriptor } from "../_register-group";
interface DeleteInput {
    id: string;
    force?: boolean;
}
interface DeleteOutput {
    id: string;
}
export declare const deleteNoteAction: ActionDescriptor<DeleteInput, DeleteOutput>;
export {};
