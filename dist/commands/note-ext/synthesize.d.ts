import type { ActionDescriptor } from "../_register-group";
import type { SynthesizeNotesResult } from "../../client";
interface Input {
    noteIds: string;
    title?: string;
    workspaceId?: string;
}
export declare const synthesizeAction: ActionDescriptor<Input, SynthesizeNotesResult>;
export {};
