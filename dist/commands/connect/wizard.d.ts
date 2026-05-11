import type { createClient } from "../../client";
type MNotesClient = ReturnType<typeof createClient>;
/** Items the wizard can scaffold */
export type WizardItem = "hooks" | "skills" | "agents" | "wiki-bootstrap";
export declare const WIZARD_CHOICES: {
    value: WizardItem;
    label: string;
    description: string;
}[];
export declare const ALL_WIZARD_ITEMS: WizardItem[];
export interface WizardOpts {
    url: string;
    workspaceId: string;
    /** When false, the PostToolUse auto-log hook is not generated. Default: true. */
    autoLog?: boolean;
    /** Required only when wiki-bootstrap is selected */
    client?: MNotesClient;
}
export interface ScaffoldResult {
    item: WizardItem;
    filesWritten: string[];
}
/**
 * Prompts the user to select which extras to install.
 * Returns the selected items. All are selected by default.
 *
 * Uses basic stdin/stdout prompting to avoid adding @inquirer/prompts dependency.
 */
export declare function promptWizardSelection(): Promise<WizardItem[]>;
/**
 * Scaffolds selected items into the target directory.
 * Merges with existing files rather than overwriting.
 *
 * Async because wiki-bootstrap makes an API call. File-only items
 * (hooks, skills, agents) are trivially awaitable — behaviour unchanged.
 */
export declare function scaffoldItems(dir: string, items: WizardItem[], opts: WizardOpts): Promise<ScaffoldResult[]>;
export {};
