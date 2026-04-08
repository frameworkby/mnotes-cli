import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { detectConnectedAgents, validateConnection, writeMcpJson, writeClaudeMdBlock, writeInstructionBlock } from "./config-utils";
import { generateClaudeCodeTemplate } from "../../templates/claude-code";
import { generateCodexTemplate } from "../../templates/codex";
import { generateOpenClawTemplate } from "../../templates/openclaw";

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
 * Handles the `claude-code` integration target.
 */
async function handleClaudeCode(opts: {
  url?: string;
  apiKey?: string;
  workspace?: string;
}): Promise<void> {
  const url = opts.url || process.env.MNOTES_URL || "http://localhost:3000";
  const apiKey = opts.apiKey || process.env.MNOTES_API_KEY;
  const workspaceId = opts.workspace || process.env.MNOTES_WORKSPACE_ID;

  if (!apiKey) {
    process.stderr.write("Error: API key required. Use --api-key or set MNOTES_API_KEY\n");
    process.exit(1);
  }

  if (!workspaceId) {
    process.stderr.write("Error: Workspace ID required. Use --workspace or set MNOTES_WORKSPACE_ID\n");
    process.exit(1);
  }

  const validation = await validateConnection(url, apiKey);
  if (!validation.ok) {
    process.stderr.write(`Error: Cannot connect to ${url}: ${validation.error}\n`);
    process.exit(1);
  }

  const dir = process.cwd();
  const mcpUrl = `${url.replace(/\/+$/, "")}/api/mcp`;

  writeMcpJson(dir, {
    "m-notes": {
      url: mcpUrl,
      env: {
        MNOTES_API_KEY: apiKey,
      },
    },
  });

  const template = generateClaudeCodeTemplate({ url, workspaceId });
  writeClaudeMdBlock(dir, template);

  console.log("Claude Code connected to m-notes!");
  console.log(`  .mcp.json  -> MCP server: ${mcpUrl}`);
  console.log(`  CLAUDE.md  -> Agent instructions added`);
  console.log(`  Workspace: ${workspaceId}`);
}

/**
 * Handles the `codex` integration target.
 */
async function handleCodex(opts: {
  url?: string;
  apiKey?: string;
  workspace?: string;
}): Promise<void> {
  const url = opts.url || process.env.MNOTES_URL || "http://localhost:3000";
  const apiKey = opts.apiKey || process.env.MNOTES_API_KEY;
  const workspaceId = opts.workspace || process.env.MNOTES_WORKSPACE_ID;

  if (!apiKey) {
    process.stderr.write("Error: API key required. Use --api-key or set MNOTES_API_KEY\n");
    process.exit(1);
  }

  if (!workspaceId) {
    process.stderr.write("Error: Workspace ID required. Use --workspace or set MNOTES_WORKSPACE_ID\n");
    process.exit(1);
  }

  const validation = await validateConnection(url, apiKey);
  if (!validation.ok) {
    process.stderr.write(`Error: Cannot connect to ${url}: ${validation.error}\n`);
    process.exit(1);
  }

  const dir = process.cwd();
  const mcpUrl = `${url.replace(/\/+$/, "")}/api/mcp`;

  const mcpEntry = {
    "m-notes": {
      url: mcpUrl,
      env: {
        MNOTES_API_KEY: apiKey,
      },
    },
  };

  writeMcpJson(dir, mcpEntry);

  const template = generateCodexTemplate({ url, workspaceId });
  writeInstructionBlock(dir, "AGENTS.md", template);

  console.log("Codex connected to m-notes!");
  console.log(`  .mcp.json  -> MCP server: ${mcpUrl}`);
  console.log(`  AGENTS.md  -> Agent instructions added`);
  console.log(`  Workspace: ${workspaceId}`);

  console.log("\nMCP config (copy if auto-detection fails):");
  console.log(JSON.stringify({ mcpServers: mcpEntry }, null, 2));
}

/**
 * Handles the `openclaw` integration target.
 */
async function handleOpenClaw(opts: {
  url?: string;
  apiKey?: string;
  workspace?: string;
  configPath?: string;
}): Promise<void> {
  const url = opts.url || process.env.MNOTES_URL || "http://localhost:3000";
  const apiKey = opts.apiKey || process.env.MNOTES_API_KEY;
  const workspaceId = opts.workspace || process.env.MNOTES_WORKSPACE_ID;
  const configPath = opts.configPath || path.join(process.env.HOME || "~", ".openclaw", "mcp.json");

  if (!apiKey) {
    process.stderr.write("Error: API key required. Use --api-key or set MNOTES_API_KEY\n");
    process.exit(1);
  }

  if (!workspaceId) {
    process.stderr.write("Error: Workspace ID required. Use --workspace or set MNOTES_WORKSPACE_ID\n");
    process.exit(1);
  }

  const validation = await validateConnection(url, apiKey);
  if (!validation.ok) {
    process.stderr.write(`Error: Cannot connect to ${url}: ${validation.error}\n`);
    process.exit(1);
  }

  const mcpUrl = `${url.replace(/\/+$/, "")}/api/mcp`;
  const configDir = path.dirname(configPath);

  // Ensure config directory exists
  fs.mkdirSync(configDir, { recursive: true });

  writeMcpJson(configDir, {
    "openclaw-mnotes": {
      url: mcpUrl,
      env: {
        MNOTES_API_KEY: apiKey,
      },
    },
  });

  const template = generateOpenClawTemplate({ url, workspaceId });
  writeInstructionBlock(configDir, "instructions.md", template);

  console.log("OpenClaw connected to m-notes!");
  console.log(`  ${path.join(configDir, ".mcp.json")}  -> MCP server: ${mcpUrl}`);
  console.log(`  ${path.join(configDir, "instructions.md")}  -> Agent instructions added`);
  console.log(`  Workspace: ${workspaceId}`);
}

/**
 * Registers the `connect` subcommand group on the root program.
 */
export function registerConnectCommand(program: Command): void {
  const connect = program
    .command("connect [target]")
    .description("Connect coding agents to m-notes")
    .option("--list", "List available integration targets")
    .option("--status", "Show connection status for agents in current directory")
    .option("--url <url>", "m-notes URL (skip prompt)")
    .option("--api-key <key>", "API key (skip prompt)")
    .option("--workspace <id>", "Workspace ID")
    .option("--config-path <path>", "Config file path (openclaw only)")
    .action(
      async (
        target: string | undefined,
        opts: {
          list?: boolean;
          status?: boolean;
          url?: string;
          apiKey?: string;
          workspace?: string;
          configPath?: string;
        }
      ) => {
        if (opts.list) {
          printIntegrationList();
          return;
        }

        if (opts.status) {
          printConnectionStatus();
          return;
        }

        if (target === "claude-code") {
          await handleClaudeCode(opts);
          return;
        }

        if (target === "codex") {
          await handleCodex(opts);
          return;
        }

        if (target === "openclaw") {
          await handleOpenClaw(opts);
          return;
        }

        if (target) {
          process.stderr.write(`Error: Unknown integration target "${target}". Use --list to see available targets.\n`);
          process.exit(1);
          return;
        }

        // No target and no flag — show help
        connect.help();
      }
    );
}
