import type { ActionDescriptor } from "../_register-group";
import type { KnowledgeLinkResult } from "../../client";
interface LinkInput {
    relationType: "supports" | "contradicts" | "extends" | "replaces" | "depends_on" | "related";
    sourceKey?: string;
    sourceNoteId?: string;
    targetKey?: string;
    targetNoteId?: string;
    description?: string;
    confidence?: number;
}
export declare const linkAction: ActionDescriptor<LinkInput, KnowledgeLinkResult>;
export {};
