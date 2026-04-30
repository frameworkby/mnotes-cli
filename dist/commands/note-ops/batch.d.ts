import type { ActionDescriptor } from "../_register-group";
interface Input {
    ids: string;
    workspaceId?: string;
}
export declare const batchAction: ActionDescriptor<Input, unknown>;
export {};
