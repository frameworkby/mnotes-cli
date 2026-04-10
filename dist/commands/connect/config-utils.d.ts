/** Shape of .mcp.json — only the parts we care about */
export interface McpJsonConfig {
    mcpServers?: Record<string, {
        url?: string;
        command?: string;
        args?: string[];
        env?: Record<string, string>;
        headers?: Record<string, string>;
        [key: string]: unknown;
    }>;
    [key: string]: unknown;
}
export interface McpReadResult {
    exists: boolean;
    config: McpJsonConfig | null;
    error?: string;
}
export interface ClaudeMdReadResult {
    exists: boolean;
    hasBlock: boolean;
    content: string | null;
}
/**
 * Safely reads and parses .mcp.json from the given directory.
 */
export declare function readMcpJson(dir: string): McpReadResult;
/**
 * Merges an m-notes MCP server entry into .mcp.json at the given directory.
 * Creates the file if it doesn't exist.
 */
export declare function writeMcpJson(dir: string, serverEntry: McpJsonConfig["mcpServers"]): void;
/**
 * Reads CLAUDE.md and checks for the m-notes instruction block.
 */
export declare function readClaudeMdBlock(dir: string): ClaudeMdReadResult;
/**
 * Writes or replaces the m-notes instruction block in CLAUDE.md.
 * Creates the file if it doesn't exist.
 */
export declare function writeClaudeMdBlock(dir: string, content: string): void;
/**
 * Writes or replaces the m-notes instruction block in any file (generalized).
 * Creates the file if it doesn't exist.
 */
export declare function writeInstructionBlock(dir: string, filename: string, content: string): void;
/**
 * Validates a connection to an m-notes instance by calling the health endpoint.
 * Returns true if the server responds successfully.
 */
export declare function validateConnection(url: string, apiKey: string): Promise<{
    ok: boolean;
    error?: string;
}>;
/**
 * Detects which agents are connected in a given directory by reading config files.
 */
export declare function detectConnectedAgents(dir: string): Map<string, {
    connected: boolean;
    url?: string;
}>;
