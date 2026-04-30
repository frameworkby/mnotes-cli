import type { ActionDescriptor } from "../_register-group";
import type { FolderRecord } from "../../client";
/**
 * `folder manage` mirrors the MCP `manage_folders` tool which is intentionally
 * action-overloaded (create | rename | delete). Keeping one CLI command
 * preserves a 1:1 parity contract: a single MCP tool maps to a single
 * `commandPath`. The `--action` flag selects the operation.
 *
 * Response shape varies by action and matches the MCP tool's response:
 *   create / rename → folder record
 *   delete          → `{ deleted: id }`
 */
interface ManageInput {
    action: "create" | "rename" | "delete";
    id?: string;
    name?: string;
    parentId?: string;
    workspaceId?: string;
}
type ManageOutput = FolderRecord | {
    deleted: string;
};
export declare const manageFoldersAction: ActionDescriptor<ManageInput, ManageOutput>;
export {};
