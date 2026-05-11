import type { ActionDescriptor } from "../_register-group";
import type { ScanConflictsResult } from "../../client";
interface ScanConflictsInput {
    similarityThreshold?: number;
    pairCap?: number;
    tags?: string;
}
export declare const scanConflictsAction: ActionDescriptor<ScanConflictsInput, ScanConflictsResult>;
export {};
