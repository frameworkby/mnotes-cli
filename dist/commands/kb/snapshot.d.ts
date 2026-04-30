import type { ActionDescriptor } from "../_register-group";
import type { SnapshotJson } from "../../client";
interface SnapshotInput {
    workspaceId?: string;
    tags?: string;
    format?: "json" | "markdown";
}
export declare const snapshotAction: ActionDescriptor<SnapshotInput, SnapshotJson | {
    markdown: string;
}>;
export {};
