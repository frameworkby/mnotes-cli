import type { ActionDescriptor } from "../_register-group";
interface CreateInput {
    name: string;
    description?: string;
}
interface CreateOutput {
    id: string;
    name: string;
    slug: string;
    isDefault: boolean;
}
export declare const createWorkspaceAction: ActionDescriptor<CreateInput, CreateOutput>;
export {};
