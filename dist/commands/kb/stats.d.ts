import type { ActionDescriptor } from "../_register-group";
import type { KbStats } from "../../client";
interface StatsInput {
    showMissing?: boolean;
}
export declare const statsAction: ActionDescriptor<StatsInput, KbStats>;
export {};
