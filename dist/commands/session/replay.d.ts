import type { ActionDescriptor } from "../_register-group";
import type { SessionReplay } from "../../client";
interface ReplayInput {
    id: string;
}
export declare const sessionReplayAction: ActionDescriptor<ReplayInput, SessionReplay>;
export {};
