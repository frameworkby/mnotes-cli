import type { ActionDescriptor } from "../_register-group";
import type { SuggestionsResult } from "../../client";
interface Input {
    id: string;
    workspaceId?: string;
}
export declare const suggestTagsLinksAction: ActionDescriptor<Input, SuggestionsResult>;
export {};
