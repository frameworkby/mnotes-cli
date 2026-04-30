import type { ActionDescriptor } from "../_register-group";
import type { SessionResumeResult } from "../../client";
interface ResumeInput {
    sessionId?: string;
    workspaceId?: string;
    includeNotes?: boolean;
    noNotes?: boolean;
}
export declare const sessionResumeAction: ActionDescriptor<ResumeInput, SessionResumeResult>;
export {};
