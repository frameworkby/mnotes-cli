import type { ActionDescriptor } from "../_register-group";
import type { NoteLinksResult } from "../../client";
interface LinksInput {
    id: string;
    workspaceId?: string;
}
export declare const noteLinksAction: ActionDescriptor<LinksInput, NoteLinksResult>;
export {};
