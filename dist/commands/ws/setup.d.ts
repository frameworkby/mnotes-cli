import type { ActionDescriptor } from "../_register-group";
interface Input {
    name: string;
    template?: string;
    description?: string;
    icon?: string;
}
export declare const setupWsAction: ActionDescriptor<Input, unknown>;
export {};
