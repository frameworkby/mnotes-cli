export interface Workspace {
    id: string;
    name: string;
    slug: string;
    isDefault: boolean;
}
interface ResolvedWorkspace {
    id: string;
    name: string;
}
/**
 * Resolves the workspace ID interactively.
 * - If exactly one workspace exists, auto-selects it with confirmation (AC-4).
 * - If multiple exist, prompts user to select or create (AC-1).
 * - If none exist, prompts to create one (AC-2, AC-3).
 */
export declare function resolveWorkspaceInteractively(baseUrl: string, apiKey: string): Promise<ResolvedWorkspace>;
export {};
