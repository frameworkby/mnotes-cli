import type { ActionDescriptor } from "../_register-group";
interface UpdateInput {
    id: string;
    title?: string;
    content?: string;
    folder?: string;
    tags?: string[];
}
interface UpdateOutput {
    id: string;
    title: string;
}
export declare const updateNoteAction: ActionDescriptor<UpdateInput, UpdateOutput>;
export {};
