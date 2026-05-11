import type { ActionDescriptor } from "../_register-group";
import type { GetProvenanceResult } from "../../client";
interface Input {
    id: string;
}
export declare const getProvenanceAction: ActionDescriptor<Input, GetProvenanceResult>;
export {};
