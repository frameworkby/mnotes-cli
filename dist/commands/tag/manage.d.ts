import type { ActionDescriptor } from "../_register-group";
interface Input {
    op: string;
    fromTag: string;
    toTag?: string;
}
export declare const manageTagsAction: ActionDescriptor<Input, unknown>;
export {};
