import type { ActionDescriptor } from "../_register-group";
import type { ScanConflictsResult } from "../../client";
interface ScanConflictsInput {
    workspaceId?: string;
    similarityThreshold?: number;
    pairCap?: number;
    tags?: string;
}
export declare const scanConflictsAction: ActionDescriptor<ScanConflictsInput, ScanConflictsResult>;
export {};
