import type { ActionDescriptor } from "../_register-group";
interface Input {
    id: string;
    content: string;
    workspaceId?: string;
}
export declare const appendAction: ActionDescriptor<Input, unknown>;
export {};
