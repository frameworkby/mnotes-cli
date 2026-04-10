import { Command } from "commander";
/** Shape of ~/.mnotes/config.json */
export interface MnotesConfig {
    apiKey: string;
    serverUrl: string;
    workspaceId?: string;
    /** Map of absolute directory path → workspace ID */
    workspaces?: Record<string, string>;
}
export declare function configPath(): string;
/**
 * Reads the stored config from ~/.mnotes/config.json.
 * Returns null if file doesn't exist or is invalid.
 */
export declare function readConfig(): MnotesConfig | null;
/**
 * Writes config to ~/.mnotes/config.json.
 */
export declare function writeConfig(config: MnotesConfig): void;
/**
 * Masks an API key for display: shows prefix + last 4 chars.
 * e.g. "mnk_abc...ef01"
 */
export declare function maskKey(key: string): string;
/**
 * Starts the local HTTP server and returns port + a promise for the key.
 */
export declare function startLocalServer(expectedState: string): Promise<{
    port: number;
    keyPromise: Promise<string>;
    close: () => void;
}>;
export declare function registerLoginCommand(program: Command): void;
