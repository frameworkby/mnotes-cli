import type { ActionDescriptor } from "../_register-group";
import type { SetImportanceResult } from "../../client";
interface Input {
    id: string;
    importance: number;
    workspaceId?: string;
}
export declare const setImportanceAction: ActionDescriptor<Input, SetImportanceResult>;
export {};
