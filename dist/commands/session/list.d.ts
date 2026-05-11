import type { ActionDescriptor } from "../_register-group";
import type { SessionListResult } from "../../client";
interface ListSessionsInput {
    limit?: number;
    cursor?: string;
}
export declare const listSessionsAction: ActionDescriptor<ListSessionsInput, SessionListResult>;
export {};
