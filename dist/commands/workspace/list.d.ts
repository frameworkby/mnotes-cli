import type { ActionDescriptor } from "../_register-group";
interface ListOutput {
    workspaces: Array<{
        id: string;
        name: string;
        slug: string;
        isDefault: boolean;
    }>;
}
export declare const listWorkspacesAction: ActionDescriptor<Record<string, never>, ListOutput>;
export {};
