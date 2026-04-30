import type { ActionDescriptor } from "../_register-group";
import type { RecentNoteItem } from "../../client";
interface RecentInput {
    since: string;
    limit?: number;
    workspaceId?: string;
}
export declare const folderRecentAction: ActionDescriptor<RecentInput, RecentNoteItem[]>;
export {};
