import type { ActionDescriptor } from "../_register-group";
interface CreateInput {
    title: string;
    content?: string;
    folderId?: string;
    /** Alias for folderId — accepted when the user types --folder instead of --folder-id. */
    folder?: string;
    tags?: string[];
}
interface CreateOutput {
    id: string;
    title: string;
}
export declare const createNoteAction: ActionDescriptor<CreateInput, CreateOutput>;
export {};
