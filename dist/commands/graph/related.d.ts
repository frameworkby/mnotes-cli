import type { ActionDescriptor } from "../_register-group";
import type { RelatedNote } from "../../client";
interface RelatedInput {
    id: string;
    limit?: number;
    minSimilarity?: number;
}
export declare const relatedNotesAction: ActionDescriptor<RelatedInput, RelatedNote[]>;
export {};
