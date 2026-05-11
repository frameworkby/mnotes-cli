import type { ActionDescriptor } from "../_register-group";
import type { NoteLinksResult } from "../../client";
interface LinksInput {
    id: string;
}
export declare const noteLinksAction: ActionDescriptor<LinksInput, NoteLinksResult>;
export {};
