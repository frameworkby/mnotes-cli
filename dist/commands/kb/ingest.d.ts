import type { ActionDescriptor } from "../_register-group";
import type { KnowledgeIngestRow } from "../../client";
interface IngestInput {
    file?: string;
    entries?: string;
    workspaceId?: string;
}
export declare const ingestAction: ActionDescriptor<IngestInput, KnowledgeIngestRow[]>;
export {};
