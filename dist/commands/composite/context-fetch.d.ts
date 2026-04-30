import type { ActionDescriptor } from "../_register-group";
interface Input {
    query: string;
    limit?: number;
    tokenBudget?: number;
    types?: string;
    tags?: string;
    workspaceId?: string;
}
export declare const contextFetchAction: ActionDescriptor<Input, unknown>;
export {};
