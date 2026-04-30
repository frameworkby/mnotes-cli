import type { ActionDescriptor } from "../_register-group";
import type { SessionLogResult } from "../../client";
interface SessionLogInput {
    sessionId: string;
    summary: string;
    decisions?: string;
    actions?: string;
    tags?: string;
    workspaceId?: string;
}
export declare const sessionLogAction: ActionDescriptor<SessionLogInput, SessionLogResult>;
export {};
