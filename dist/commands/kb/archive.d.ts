import type { ActionDescriptor } from "../_register-group";
import type { ArchiveStaleResult } from "../../client";
interface ArchiveInput {
    workspaceId?: string;
    maxDecayScore?: number;
    maxImportance?: number;
    dryRun?: boolean;
}
export declare const archiveAction: ActionDescriptor<ArchiveInput, ArchiveStaleResult>;
export {};
