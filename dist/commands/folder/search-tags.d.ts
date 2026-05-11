import type { ActionDescriptor } from "../_register-group";
import type { TaggedNoteItem } from "../../client";
interface SearchTagsInput {
    tags: string;
    match?: "any" | "all";
    limit?: number;
}
export declare const folderSearchTagsAction: ActionDescriptor<SearchTagsInput, TaggedNoteItem[]>;
export {};
