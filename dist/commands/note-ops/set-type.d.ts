import type { ActionDescriptor } from "../_register-group";
interface Input {
    id: string;
    type: string;
    workspaceId?: string;
}
export declare const setTypeAction: ActionDescriptor<Input, unknown>;
export {};
