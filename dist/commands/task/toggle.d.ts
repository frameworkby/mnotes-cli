import type { ActionDescriptor } from "../_register-group";
import type { TaskToggleResult } from "../../client";
interface ToggleTaskInput {
    noteId: string;
    taskIndex: number;
    done?: boolean;
    notDone?: boolean;
}
export declare const toggleTaskAction: ActionDescriptor<ToggleTaskInput, TaskToggleResult>;
export {};
