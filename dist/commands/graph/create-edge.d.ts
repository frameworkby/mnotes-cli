import type { ActionDescriptor } from "../_register-group";
import type { GraphEdgeRecord } from "../../client";
interface CreateEdgeInput {
    sourceId: string;
    targetId: string;
    edgeType?: "wikilink" | "related" | "parent" | "tagged" | "custom";
    weight?: number;
    metadata?: string;
}
export declare const createEdgeAction: ActionDescriptor<CreateEdgeInput, GraphEdgeRecord>;
export {};
