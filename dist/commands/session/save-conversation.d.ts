import type { ActionDescriptor } from "../_register-group";
interface Input {
    workspaceId?: string;
    messages: string;
    title?: string;
    source?: string;
}
export declare const saveConversationAction: ActionDescriptor<Input, unknown>;
export {};
