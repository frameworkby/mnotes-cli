import type { ActionDescriptor } from "../_register-group";
interface DeleteEmptyInput {
    dryRun?: boolean;
    folder?: string;
}
interface DeleteEmptyOutput {
    candidates: string[];
    deleted: string[];
    failed: Array<{
        id: string;
        error: string;
    }>;
}
export declare const deleteEmptyFoldersAction: ActionDescriptor<DeleteEmptyInput, DeleteEmptyOutput>;
export {};
