import type { ActionDescriptor } from "../_register-group";
import type { QueryByTypeResult } from "../../client";
interface Input {
    type: string;
    limit?: number;
    propertyFilters?: string;
}
export declare const queryByTypeAction: ActionDescriptor<Input, QueryByTypeResult>;
export {};
