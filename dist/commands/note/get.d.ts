import type { Note } from "../../client";
import type { ActionDescriptor } from "../_register-group";
interface GetInput {
    id: string;
}
export declare const getNoteAction: ActionDescriptor<GetInput, Note>;
export {};
