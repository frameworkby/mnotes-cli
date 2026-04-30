import type { ActionDescriptor } from "../_register-group";
interface Input {
    op: string;
    fromTag: string;
    toTag?: string;
    workspaceId?: string;
}
export declare const manageTagsAction: ActionDescriptor<Input, unknown>;
export {};
