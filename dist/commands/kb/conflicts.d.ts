import type { ActionDescriptor } from "../_register-group";
import type { ConflictRow } from "../../client";
interface ConflictsInput {
    workspaceId?: string;
    classification?: "contradicting" | "complementary" | "unrelated" | "all";
}
export declare const conflictsAction: ActionDescriptor<ConflictsInput, ConflictRow[]>;
export {};
