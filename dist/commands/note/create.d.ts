import type { ActionDescriptor } from "../_register-group";
interface CreateInput {
    title: string;
    content?: string;
    folder?: string;
    tags?: string[];
    workspace?: string;
}
interface CreateOutput {
    id: string;
    title: string;
}
export declare const createNoteAction: ActionDescriptor<CreateInput, CreateOutput>;
export {};
