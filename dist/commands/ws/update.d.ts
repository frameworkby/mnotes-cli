import type { ActionDescriptor } from "../_register-group";
interface Input {
    id: string;
    name?: string;
    description?: string;
    icon?: string;
}
export declare const updateWsAction: ActionDescriptor<Input, unknown>;
export {};
