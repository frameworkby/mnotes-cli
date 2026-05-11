import type { ActionDescriptor } from "../_register-group";
import type { RecallEntry } from "../../client";
interface RecallInput {
    query: string;
    tags?: string;
    limit?: number;
    decayWindow?: number;
}
export declare const recallAction: ActionDescriptor<RecallInput, RecallEntry[]>;
export {};
