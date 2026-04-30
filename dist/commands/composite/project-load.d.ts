import type { ActionDescriptor } from "../_register-group";
interface Input {
    query?: string;
    path?: string;
    workspaceId?: string;
}
export declare const projectLoadAction: ActionDescriptor<Input, unknown>;
export {};
