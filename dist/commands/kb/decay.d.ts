import type { ActionDescriptor } from "../_register-group";
import type { DecayEntry } from "../../client";
interface DecayInput {
    threshold?: number;
    limit?: number;
    decayWindow?: number;
    tags?: string;
    maxImportance?: number;
}
export declare const decayAction: ActionDescriptor<DecayInput, DecayEntry[]>;
export {};
