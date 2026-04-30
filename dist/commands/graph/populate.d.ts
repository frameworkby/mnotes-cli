import type { ActionDescriptor } from "../_register-group";
import type { PopulateGraphResult } from "../../client";
interface PopulateInput {
    workspaceId?: string;
}
export declare const populateGraphAction: ActionDescriptor<PopulateInput, PopulateGraphResult>;
export {};
