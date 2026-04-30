import type { ActionDescriptor } from "../_register-group";
interface Input {
    id: string;
    starred?: boolean;
    unstar?: boolean;
    workspaceId?: string;
}
export declare const starAction: ActionDescriptor<Input, unknown>;
export {};
