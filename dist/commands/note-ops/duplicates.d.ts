import type { ActionDescriptor } from "../_register-group";
interface Input {
    noteId: string;
    threshold?: number;
    limit?: number;
}
export declare const duplicatesAction: ActionDescriptor<Input, unknown>;
export {};
