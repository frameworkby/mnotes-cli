import type { ActionDescriptor } from "../_register-group";
interface Input {
    id: string;
    fields: string;
    workspaceId?: string;
}
export declare const frontmatterSetAction: ActionDescriptor<Input, unknown>;
export {};
