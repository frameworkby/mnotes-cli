import type { ActionDescriptor } from "../_register-group";
import type { SuggestTagsResult } from "../../client";
interface Input {
    id: string;
}
export declare const suggestTagsAction: ActionDescriptor<Input, SuggestTagsResult>;
export {};
