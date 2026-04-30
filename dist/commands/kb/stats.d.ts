import type { ActionDescriptor } from "../_register-group";
import type { KbStats } from "../../client";
interface StatsInput {
    workspaceId?: string;
}
export declare const statsAction: ActionDescriptor<StatsInput, KbStats>;
export {};
