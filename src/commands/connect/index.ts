import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { detectConnectedAgents, validateConnection, writeMcpJson, writeClaudeMdBlock, writeInstructionBlock } from "./config-utils";
import { resolveWorkspaceInteractively } from "./workspace-prompt";
import { generateClaudeCodeTemplate } from "../../templates/claude-code";
import { generateCodexTemplate } from "../../templates/codex";
import { generateOpenClawTemplate } from "../../templates/openclaw";
import { promptWizardSelection, scaffoldItems, ALL_WIZARD_ITEMS } from "./wizard";
import type { WizardItem, ScaffoldResult } from "./wizard";

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
 * Resolves the workspace ID — uses --workspace flag if provided, otherwise
 * prompts interactively after validating the connection.
 */
async function resolveWorkspace(opts: {
  url: string;
  apiKey: string;
  workspace?: string;
}): Promise<string> {
  // AC-5: --workspace flag works as before
  const fromFlag = opts.workspace || process.env.MNOTES_WORKSPACE_ID;
  if (fromFlag) return fromFlag;

  // AC-1/AC-2/AC-3/AC-4: Interactive workspace selection/creation
  const resolved = await resolveWorkspaceInteractively(opts.url, opts.apiKey);
  return resolved.id;
}

/**
 * Handles the `claude-code` integration target.
 */
/**
 * Normalize the base URL: strip trailing slashes and /api/mcp suffix.
 * Users often pass the full MCP endpoint URL, but the code appends /api/mcp.
 */
function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "").replace(/\/api\/mcp$/i, "");
}

export async function handleClaudeCode(opts: {
  url?: string;
  apiKey?: string;
  workspace?: string;
  noWizard?: boolean;
  all?: boolean;
}): Promise<void> {
  const url = normalizeBaseUrl(opts.url || process.env.MNOTES_URL || "https://mnotes.framework.by");
  const apiKey = opts.apiKey || process.env.MNOTES_API_KEY;

  if (!apiKey) {
    process.stderr.write("Error: API key required. Use --api-key or set MNOTES_API_KEY\n");
    process.exit(1);
  }

  const validation = await validateConnection(url, apiKey);
  if (!validation.ok) {
    process.stderr.write(`Error: Cannot connect to ${url}: ${validation.error}\n`);
    process.exit(1);
  }

  const workspaceId = await resolveWorkspace({ url, apiKey, workspace: opts.workspace });

  const dir = process.cwd();
  const mcpUrl = `${url.replace(/\/+$/, "")}/api/mcp`;

  // Core setup — always runs
  writeMcpJson(dir, {
    "m-notes": {
      type: "http",
      url: mcpUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  });

  const template = generateClaudeCodeTemplate({ url, workspaceId });
  writeClaudeMdBlock(dir, template);

  console.log("Claude Code connected to m-notes!");
  console.log(`  .mcp.json  -> MCP server: ${mcpUrl}`);
  console.log(`  CLAUDE.md  -> Agent instructions added`);
  console.log(`  Workspace: ${workspaceId}`);

  // Wizard phase — scaffold optional extras
  if (opts.noWizard) {
    return;
  }

  let selectedItems: WizardItem[];

  if (opts.all) {
    selectedItems = ALL_WIZARD_ITEMS;
  } else {
    selectedItems = await promptWizardSelection();
  }

  if (selectedItems.length === 0) {
    return;
  }

  const results = scaffoldItems(dir, selectedItems, { url, workspaceId });
  printScaffoldResults(results);
}

/**
 * Prints a summary of scaffolded files.
 */
function printScaffoldResults(results: ScaffoldResult[]): void {
  if (results.length === 0) return;

  console.log("\nExtras installed:");
  for (const result of results) {
    if (result.filesWritten.length === 0) {
      console.log(`  ${result.item}: skipped (existing files preserved)`);
    } else {
      for (const file of result.filesWritten) {
        console.log(`  ${result.item}: ${file}`);
      }
    }
  }
}

/**
 * Handles the `codex` integration target.
 */
async function handleCodex(opts: {
  url?: string;
  apiKey?: string;
  workspace?: string;
}): Promise<void> {
  const url = normalizeBaseUrl(opts.url || process.env.MNOTES_URL || "https://mnotes.framework.by");
  const apiKey = opts.apiKey || process.env.MNOTES_API_KEY;

  if (!apiKey) {
    process.stderr.write("Error: API key required. Use --api-key or set MNOTES_API_KEY\n");
    process.exit(1);
  }

  const validation = await validateConnection(url, apiKey);
  if (!validation.ok) {
    process.stderr.write(`Error: Cannot connect to ${url}: ${validation.error}\n`);
    process.exit(1);
  }

  const workspaceId = await resolveWorkspace({ url, apiKey, workspace: opts.workspace });

  const dir = process.cwd();
  const mcpUrl = `${url.replace(/\/+$/, "")}/api/mcp`;

  const mcpEntry = {
    "m-notes": {
      type: "http",
      url: mcpUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
  const url = normalizeBaseUrl(opts.url || process.env.MNOTES_URL || "https://mnotes.framework.by");
  const apiKey = opts.apiKey || process.env.MNOTES_API_KEY;
  const configPath = opts.configPath || path.join(process.env.HOME || "~", ".openclaw", "mcp.json");

  if (!apiKey) {
    process.stderr.write("Error: API key required. Use --api-key or set MNOTES_API_KEY\n");
    process.exit(1);
  }

  const validation = await validateConnection(url, apiKey);
  if (!validation.ok) {
    process.stderr.write(`Error: Cannot connect to ${url}: ${validation.error}\n`);
    process.exit(1);
  }

  const workspaceId = await resolveWorkspace({ url, apiKey, workspace: opts.workspace });

  const mcpUrl = `${url.replace(/\/+$/, "")}/api/mcp`;
  const configDir = path.dirname(configPath);

  // Ensure config directory exists
  fs.mkdirSync(configDir, { recursive: true });

  writeMcpJson(configDir, {
    "openclaw-mnotes": {
      type: "http",
      url: mcpUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
    .option("--no-wizard", "Skip the extras wizard (core setup only)")
    .option("--all", "Install all extras without prompting")
    .action(
      async (
        target: string | undefined,
        localOpts: {
          list?: boolean;
          status?: boolean;
          url?: string;
          apiKey?: string;
          workspace?: string;
          configPath?: string;
          wizard?: boolean;
          all?: boolean;
        }
      ) => {
        // Merge parent program options (--api-key, --url) with subcommand options.
        // Commander v4 with passCommandToAction(false) passes parent-level flags
        // to the parent opts, not the subcommand opts.
        const globalOpts = program.opts() as { apiKey?: string; url?: string };
        const opts = { ...localOpts };
        if (!opts.apiKey && globalOpts.apiKey) opts.apiKey = globalOpts.apiKey;
        if (!opts.url && globalOpts.url) opts.url = globalOpts.url;

        if (opts.list) {
          printIntegrationList();
          return;
        }

        if (opts.status) {
          printConnectionStatus();
          return;
        }

        if (target === "claude-code") {
          await handleClaudeCode({
            ...opts,
            noWizard: opts.wizard === false,
            all: opts.all,
          });
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
