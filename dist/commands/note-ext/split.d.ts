import type { ActionDescriptor } from "../_register-group";
import type { SplitNoteResult } from "../../client";
interface Input {
    id: string;
    splitPoint?: number;
    title2?: string;
    workspaceId?: string;
}
export declare const splitNoteAction: ActionDescriptor<Input, SplitNoteResult>;
export {};
