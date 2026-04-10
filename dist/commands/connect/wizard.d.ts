/** Items the wizard can scaffold */
export type WizardItem = "hooks" | "skills" | "agents";
export declare const WIZARD_CHOICES: {
    value: WizardItem;
    label: string;
    description: string;
}[];
export declare const ALL_WIZARD_ITEMS: WizardItem[];
export interface WizardOpts {
    url: string;
    workspaceId: string;
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
 */
export declare function scaffoldItems(dir: string, items: WizardItem[], opts: WizardOpts): ScaffoldResult[];
