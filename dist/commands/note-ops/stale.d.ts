import type { ActionDescriptor } from "../_register-group";
interface Input {
    daysSince?: number;
    limit?: number;
    workspaceId?: string;
}
export declare const staleAction: ActionDescriptor<Input, unknown>;
export {};
