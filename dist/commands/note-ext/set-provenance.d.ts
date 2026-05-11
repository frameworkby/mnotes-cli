import type { ActionDescriptor } from "../_register-group";
import type { SetProvenanceResult } from "../../client";
declare const SOURCE_VALUES: readonly ["url", "mcp_tool", "conversation", "manual"];
type SourceValue = (typeof SOURCE_VALUES)[number];
interface Input {
    id: string;
    source: SourceValue;
    ref: string;
}
export declare const setProvenanceAction: ActionDescriptor<Input, SetProvenanceResult>;
export {};
