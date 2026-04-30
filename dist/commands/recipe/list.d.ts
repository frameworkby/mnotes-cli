import type { ActionDescriptor } from "../_register-group";
import type { ListRecipesResult } from "../../client";
interface Input {
    workspaceId?: string;
}
export declare const listRecipesAction: ActionDescriptor<Input, ListRecipesResult>;
export {};
