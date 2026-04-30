import type { ActionDescriptor } from "../_register-group";
import type { RunRecipeResult } from "../../client";
interface Input {
    id: string;
    noteId: string;
    workspaceId?: string;
}
export declare const runRecipeAction: ActionDescriptor<Input, RunRecipeResult>;
export {};
