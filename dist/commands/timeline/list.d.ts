import type { ActionDescriptor } from "../_register-group";
import type { TimelineEntry } from "../../client";
interface TimelineListInput {
    from?: string;
    to?: string;
    limit?: number;
}
export declare const listTimelineAction: ActionDescriptor<TimelineListInput, TimelineEntry[]>;
export {};
