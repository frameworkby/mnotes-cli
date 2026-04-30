import type { ActionDescriptor } from "../_register-group";
interface SelectInput {
    id?: string;
    global?: boolean;
}
interface SelectOutput {
    id: string;
    name: string;
    slug: string;
    isDefault: boolean;
}
/**
 * `workspace select` — sets the server-side default workspace for the user
 * (PATCH /api/v1/workspaces/:id with { isDefault: true }).
 *
 * Behaviour matrix:
 *   <id> given            → server-side default flip (parity with MCP set_active_workspace)
 *   no id, --global       → interactive picker, persists to global config (legacy)
 *   no id, no flag        → interactive picker, persists per-directory mapping (legacy)
 */
export declare const selectWorkspaceAction: ActionDescriptor<SelectInput, SelectOutput>;
export {};
