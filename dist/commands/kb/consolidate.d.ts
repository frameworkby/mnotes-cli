import type { ActionDescriptor } from "../_register-group";
import type { ConsolidateResult } from "../../client";
interface ConsolidateInput {
    noteIds: string;
    targetTitle: string;
    strategy: "merge" | "summarize";
}
export declare const consolidateAction: ActionDescriptor<ConsolidateInput, ConsolidateResult>;
export {};
