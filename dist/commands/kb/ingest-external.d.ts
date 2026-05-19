import type { ActionDescriptor } from "../_register-group";
import type { IngestExternalResult } from "../../client";
interface IngestExternalInput {
    title?: string;
    content?: string;
    contentFile?: string;
    sourceType?: string;
    sourceUrl?: string;
    sourceRef?: string;
    tags?: string;
    folderId?: string;
    /** Alias for folderId — accepted when the user types --folder instead of --folder-id. */
    folder?: string;
}
export declare const ingestExternalAction: ActionDescriptor<IngestExternalInput, IngestExternalResult>;
export {};
