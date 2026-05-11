import type { ActionDescriptor } from "../_register-group";
interface Input {
    messages: string;
    title?: string;
    source?: string;
}
export declare const saveConversationAction: ActionDescriptor<Input, unknown>;
export {};
