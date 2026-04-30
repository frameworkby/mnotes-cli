import type { ActionDescriptor } from "../_register-group";
interface Input {
    id: string;
    limit?: number;
    workspaceId?: string;
}
export declare const versionsAction: ActionDescriptor<Input, unknown>;
export {};
