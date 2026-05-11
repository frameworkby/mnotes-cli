import { Command } from "commander";
/** Available integration targets with descriptions */
export declare const INTEGRATION_TARGETS: readonly [{
    readonly name: "claude-code";
    readonly description: "Connect Claude Code project-level via CLAUDE.md instructions";
}, {
    readonly name: "codex";
    readonly description: "Connect OpenAI Codex via AGENTS.md instructions";
}, {
    readonly name: "openclaw";
    readonly description: "Connect OpenClaw for mobile/conversational use";
}];
export type IntegrationName = (typeof INTEGRATION_TARGETS)[number]["name"];
/**
 * Handles the `claude-code` integration target.
 */
export declare function handleClaudeCode(opts: {
    url?: string;
    apiKey?: string;
    noWizard?: boolean;
    all?: boolean;
    autoLog?: boolean;
}): Promise<void>;
/**
 * Registers the `connect` subcommand group on the root program.
 */
export declare function registerConnectCommand(program: Command): void;
