import type { ActionDescriptor } from "../_register-group";
import type { TaskItem } from "../../client";
interface ListTasksInput {
    status?: "all" | "open" | "done";
    tag?: string;
    noteId?: string;
    limit?: number;
    workspaceId?: string;
}
export declare const listTasksAction: ActionDescriptor<ListTasksInput, TaskItem[]>;
export {};
