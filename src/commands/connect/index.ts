import { Command } from "commander";
import { detectConnectedAgents } from "./config-utils";

/** Available integration targets with descriptions */
export const INTEGRATION_TARGETS = [
  {
    name: "claude-code",
    description:
      "Connect Claude Code via MCP server config and CLAUDE.md instructions",
  },
  {
    name: "codex",
    description: "Connect OpenAI Codex via MCP config (experimental)",
  },
  {
    name: "openclaw",
    description: "Connect OpenClaw for mobile/conversational use",
  },
] as const;

export type IntegrationName = (typeof INTEGRATION_TARGETS)[number]["name"];

/**
 * Prints the list of available integration targets.
 */
function printIntegrationList(): void {
  console.log("Available integrations:");

  const nameWidth = Math.max(...INTEGRATION_TARGETS.map((t) => t.name.length));

  for (const target of INTEGRATION_TARGETS) {
    console.log(`  ${target.name.padEnd(nameWidth)}    ${target.description}`);
  }
}

/**
 * Prints connection status for all agents in the current directory.
 */
function printConnectionStatus(): void {
  const dir = process.cwd();
  const agents = detectConnectedAgents(dir);

  console.log("Agent Connect Status (current directory):");

  const nameWidth = Math.max(
    ...INTEGRATION_TARGETS.map((t) => t.name.length)
  );
  const statusWidth = "not connected".length;

  for (const target of INTEGRATION_TARGETS) {
    const info = agents.get(target.name);
    const connected = info?.connected ?? false;
    const status = connected ? "connected" : "not connected";
    const urlSuffix = connected && info?.url ? `    ${info.url}` : "";

    console.log(
      `  ${target.name.padEnd(nameWidth)}    ${status.padEnd(statusWidth)}${urlSuffix}`
    );
  }
}

/**
 * Registers the `connect` subcommand group on the root program.
 */
export function registerConnectCommand(program: Command): void {
  const connect = program
    .command("connect")
    .description("Connect coding agents to m-notes")
    .option("--list", "List available integration targets")
    .option("--status", "Show connection status for agents in current directory")
    .option("--url <url>", "m-notes URL (skip prompt)")
    .option("--api-key <key>", "API key (skip prompt)")
    .option("--workspace <id>", "Workspace ID")
    .action(
      async (opts: {
        list?: boolean;
        status?: boolean;
        url?: string;
        apiKey?: string;
        workspace?: string;
      }) => {
        if (opts.list) {
          printIntegrationList();
          return;
        }

        if (opts.status) {
          printConnectionStatus();
          return;
        }

        // No flag provided — show help
        connect.help();
      }
    );
}
