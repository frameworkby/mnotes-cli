import type { ActionDescriptor } from "../_register-group";
import type { TaskToggleResult } from "../../client";
interface ToggleTaskInput {
    noteId: string;
    taskIndex: number;
    done?: boolean;
    notDone?: boolean;
    workspaceId?: string;
}
export declare const toggleTaskAction: ActionDescriptor<ToggleTaskInput, TaskToggleResult>;
export {};
