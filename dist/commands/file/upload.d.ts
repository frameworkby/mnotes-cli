import type { ActionDescriptor } from "../_register-group";
import type { UploadResult } from "../../client";
interface UploadInput {
    path?: string;
    content?: string;
    filename?: string;
    mimeType: string;
    noteId?: string;
}
export declare const uploadFileAction: ActionDescriptor<UploadInput, UploadResult>;
export {};
