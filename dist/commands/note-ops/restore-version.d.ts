import type { ActionDescriptor } from "../_register-group";
interface Input {
    id: string;
    versionId: string;
    workspaceId?: string;
}
export declare const restoreVersionAction: ActionDescriptor<Input, unknown>;
export {};
