import type { ActionDescriptor } from "../_register-group";
import type { ArchiveStaleResult } from "../../client";
interface ArchiveInput {
    maxDecayScore?: number;
    maxImportance?: number;
    dryRun?: boolean;
}
export declare const archiveAction: ActionDescriptor<ArchiveInput, ArchiveStaleResult>;
export {};
