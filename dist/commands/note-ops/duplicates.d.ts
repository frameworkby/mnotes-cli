import type { ActionDescriptor } from "../_register-group";
interface Input {
    noteId: string;
    threshold?: number;
    limit?: number;
    workspaceId?: string;
}
export declare const duplicatesAction: ActionDescriptor<Input, unknown>;
export {};
