import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { detectConnectedAgents, validateConnection, writeClaudeMdBlock, writeInstructionBlock } from "./config-utils";
import { resolveWorkspaceInteractively } from "./workspace-prompt";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import { sendTelemetry } from "./telemetry";
import { generateClaudeCodeTemplate } from "../../templates/claude-code";
import { generateCodexTemplate } from "../../templates/codex";
import { generateOpenClawTemplate } from "../../templates/openclaw";
import { promptWizardSelection, scaffoldItems, ALL_WIZARD_ITEMS } from "./wizard";
import type { WizardItem, ScaffoldResult } from "./wizard";

/** Available integration targets with descriptions */
export const INTEGRATION_TARGETS = [
  {
    name: "claude",
    description:
      "Connect Claude Code globally via ~/.claude/mcp.json",
  },
  {
    name: "claude-code",
    description:
      "Connect Claude Code project-level via CLAUDE.md instructions",
  },
  {
    name: "cursor",
    description:
      "Connect Cursor globally via ~/.cursor/mcp.json",
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
 *
 * When a workspace value is provided (flag, env, or config), validates it
 * against the API by matching on ID or slug. If not found, prompts to create.
 */
async function resolveWorkspace(opts: {
  url: string;
  apiKey: string;
  workspace?: string;
}): Promise<string> {
  // Check flag, env, dir map, global config
  const fromConfig = resolveConfig({ workspaceId: opts.workspace });
  const candidate = fromConfig.workspaceId;

  if (candidate) {
    // Validate the candidate against the API
    const client = createClient(opts.url, opts.apiKey);
    let workspaces;
    try {
      const res = await client.listWorkspaces();
      workspaces = res.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to fetch workspaces: ${message}`);
    }

    // Match by ID or slug
    const match = workspaces.find(
      (ws) => ws.id === candidate || ws.slug === candidate
    );

    if (match) {
      return match.id;
    }

    // Not found — ask user to create
    process.stderr.write(
      `\nWorkspace "${candidate}" not found.\n`
    );

    const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
    const answer = await new Promise<string>((resolve) =>
      rl.question(`Create workspace "${candidate}"? [Y/n] `, resolve)
    );
    rl.close();

    if (answer.trim() === "" || answer.trim().toLowerCase() === "y") {
      const created = await client.createWorkspace(candidate);
      process.stderr.write(`Created workspace "${created.data.name}" (${created.data.id})\n`);
      return created.data.id;
    }

    // User declined — fall through to interactive
    process.stderr.write("Falling back to interactive workspace selection.\n");
  }

  // Nothing stored or user declined — interactive selection/creation
  const resolved = await resolveWorkspaceInteractively(opts.url, opts.apiKey);
  return resolved.id;
}

/**
 * Normalize the base URL: strip trailing slashes and any legacy /api/mcp suffix.
 * Earlier versions of the CLI pointed at the MCP endpoint directly; we accept
 * those URLs and reduce them back to the bare server origin.
 */
function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "").replace(/\/api\/mcp$/i, "");
}

/**
 * Prints a structured connection error to stderr and exits non-zero.
 * Provides actionable hints based on the error kind.
 */
function printConnectionError(url: string, validation: { ok: false; error: string; kind: "auth" | "timeout" | "network" }): never {
  if (validation.kind === "auth") {
    process.stderr.write(`Error: Authentication failed for ${url}: ${validation.error}\n`);
    process.stderr.write(`Hint: Run: npx mnotes auth login\n`);
  } else if (validation.kind === "timeout") {
    process.stderr.write(`Error: Connection to ${url} timed out: ${validation.error}\n`);
    process.stderr.write(`Hint: Check your network connection and try again.\n`);
  } else {
    process.stderr.write(`Error: Cannot connect to ${url}: ${validation.error}\n`);
  }
  process.exit(1);
}

/**
 * Handles the `claude` integration target.
 * Writes the m-notes MCP server entry to ~/.claude/mcp.json so Claude Code
 * picks it up globally (no project-level config file needed).
 */
export async function handleClaude(opts: {
  url?: string;
  apiKey?: string;
  workspace?: string;
}): Promise<void> {
  const config = resolveConfig(opts);
  const url = normalizeBaseUrl(config.baseUrl);
  const apiKey = config.apiKey;

  const validation = await validateConnection(url, apiKey);
  if (!validation.ok) {
    printConnectionError(url, validation);
  }

  const workspaceId = await resolveWorkspace({ url, apiKey, workspace: opts.workspace });

  // Fetch workspace name for the success message
  let workspaceName = workspaceId;
  try {
    const client = createClient(url, apiKey);
    const res = await client.listWorkspaces();
    const match = res.data.find((ws) => ws.id === workspaceId);
    if (match) workspaceName = match.name;
  } catch {
    // Best-effort — fall back to ID if name lookup fails
  }

  // Write the MCP server entry to ~/.claude/mcp.json
  const claudeConfigDir = path.join(process.env.HOME ?? "~", ".claude");
  fs.mkdirSync(claudeConfigDir, { recursive: true });
  const mcpJsonPath = path.join(claudeConfigDir, "mcp.json");

  // Read existing config (if any) and merge in the m-notes entry
  let existingGlobal: { mcpServers?: Record<string, unknown> } = {};
  try {
    existingGlobal = JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8")) as typeof existingGlobal;
  } catch {
    // File absent or unreadable — start fresh
  }
  if (!existingGlobal.mcpServers) existingGlobal.mcpServers = {};
  existingGlobal.mcpServers["m-notes"] = { url: `${url}/api/mcp` };
  fs.writeFileSync(mcpJsonPath, JSON.stringify(existingGlobal, null, 2) + "\n", "utf-8");

  console.log(`✓ Claude Code is now connected to workspace '${workspaceName}'. Config written to ${mcpJsonPath}.`);
  void sendTelemetry({ event: "cli_connect_success", target: "claude" });

  // Stamp first-connect timestamp on the workspace (best-effort, fire-and-forget)
  try {
    const client = createClient(url, apiKey);
    await client.markAgentConnected(workspaceId);
  } catch {
    // Non-critical — banner simply won't appear if this fails
  }
}

/**
 * Handles the `cursor` integration target.
 * Writes the m-notes MCP server entry to ~/.cursor/mcp.json so Cursor
 * picks it up globally across all projects.
 * Source: https://cursor.com/docs/mcp — "global tools available across all
 * projects are defined in a ~/.cursor/mcp.json file in the user's home directory."
 */
export async function handleCursor(opts: {
  url?: string;
  apiKey?: string;
  workspace?: string;
}): Promise<void> {
  const config = resolveConfig(opts);
  const url = normalizeBaseUrl(config.baseUrl);
  const apiKey = config.apiKey;

  const validation = await validateConnection(url, apiKey);
  if (!validation.ok) {
    printConnectionError(url, validation);
  }

  const workspaceId = await resolveWorkspace({ url, apiKey, workspace: opts.workspace });

  // Fetch workspace name for the success message
  let workspaceName = workspaceId;
  try {
    const client = createClient(url, apiKey);
    const res = await client.listWorkspaces();
    const match = res.data.find((ws) => ws.id === workspaceId);
    if (match) workspaceName = match.name;
  } catch {
    // Best-effort — fall back to ID if name lookup fails
  }

  // Write the MCP server entry to ~/.cursor/mcp.json
  const cursorConfigDir = path.join(process.env.HOME ?? "~", ".cursor");
  const dirExisted = fs.existsSync(cursorConfigDir);
  fs.mkdirSync(cursorConfigDir, { recursive: true });
  if (!dirExisted) {
    process.stderr.write(`Warning: ~/.cursor directory did not exist — created it.\n`);
  }
  const mcpJsonPath = path.join(cursorConfigDir, "mcp.json");

  // Read existing config (if any) and merge in the m-notes entry
  let existingGlobal: { mcpServers?: Record<string, unknown> } = {};
  try {
    existingGlobal = JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8")) as typeof existingGlobal;
  } catch {
    // File absent or unreadable — start fresh
  }
  if (!existingGlobal.mcpServers) existingGlobal.mcpServers = {};
  existingGlobal.mcpServers["m-notes"] = { url: `${url}/api/mcp` };
  fs.writeFileSync(mcpJsonPath, JSON.stringify(existingGlobal, null, 2) + "\n", "utf-8");

  console.log(`✓ Cursor is now connected to workspace '${workspaceName}'. Config written to ${mcpJsonPath}.`);
  void sendTelemetry({ event: "cli_connect_success", target: "cursor" });

  // Stamp first-connect timestamp on the workspace (best-effort, fire-and-forget)
  try {
    const client = createClient(url, apiKey);
    await client.markAgentConnected(workspaceId);
  } catch {
    // Non-critical — banner simply won't appear if this fails
  }
}

/**
 * Handles the `claude-code` integration target.
 */
export async function handleClaudeCode(opts: {
  url?: string;
  apiKey?: string;
  workspace?: string;
  noWizard?: boolean;
  all?: boolean;
}): Promise<void> {
  const config = resolveConfig(opts);
  const url = normalizeBaseUrl(config.baseUrl);
  const apiKey = config.apiKey;

  const validation = await validateConnection(url, apiKey);
  if (!validation.ok) {
    if (validation.kind === "auth") {
      process.stderr.write(`Error: Authentication failed for ${url}: ${validation.error}\n`);
      process.stderr.write(`Hint: Run: npx mnotes auth login\n`);
    } else if (validation.kind === "timeout") {
      process.stderr.write(`Error: Connection to ${url} timed out: ${validation.error}\n`);
      process.stderr.write(`Hint: Check your network connection and try again.\n`);
    } else {
      process.stderr.write(`Error: Cannot connect to ${url}: ${validation.error}\n`);
    }
    process.exit(1);
  }

  const workspaceId = await resolveWorkspace({ url, apiKey, workspace: opts.workspace });

  const dir = process.cwd();

  // Core setup — always runs.
  // We deliberately do NOT write `.mcp.json` here: the m-notes server no longer
  // exposes an MCP endpoint, and writing the API key into a project-level file
  // is a credential-leakage risk (see #594). The CLI's own config file
  // (`~/.mnotes/config.json`) remains the single source of truth for the API
  // key — `mnotes login` writes it there.
  const template = generateClaudeCodeTemplate({ url, workspaceId });
  writeClaudeMdBlock(dir, template);

  console.log("Connected. Your AI client is configured to use the m-notes v1 API.");
  console.log(`  CLAUDE.md  -> Agent instructions added`);
  console.log(`  API base   -> ${url}`);
  console.log(`  Workspace  -> ${workspaceId}`);

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
  const config = resolveConfig(opts);
  const url = normalizeBaseUrl(config.baseUrl);
  const apiKey = config.apiKey;

  const validation = await validateConnection(url, apiKey);
  if (!validation.ok) {
    process.stderr.write(`Error: Cannot connect to ${url}: ${validation.error}\n`);
    process.exit(1);
  }

  const workspaceId = await resolveWorkspace({ url, apiKey, workspace: opts.workspace });

  const dir = process.cwd();

  // No `.mcp.json` written — the m-notes MCP endpoint was removed. The agent
  // talks to the v1 HTTP API, and the API key lives only in the CLI config
  // (`~/.mnotes/config.json`), never in a project-level file (#594).
  const template = generateCodexTemplate({ url, workspaceId });
  writeInstructionBlock(dir, "AGENTS.md", template);

  console.log("Connected. Your AI client is configured to use the m-notes v1 API.");
  console.log(`  AGENTS.md  -> Agent instructions added`);
  console.log(`  API base   -> ${url}`);
  console.log(`  Workspace  -> ${workspaceId}`);
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
  const config = resolveConfig(opts);
  const url = normalizeBaseUrl(config.baseUrl);
  const apiKey = config.apiKey;
  const configPath = opts.configPath || path.join(process.env.HOME || "~", ".openclaw", "mcp.json");

  const validation = await validateConnection(url, apiKey);
  if (!validation.ok) {
    process.stderr.write(`Error: Cannot connect to ${url}: ${validation.error}\n`);
    process.exit(1);
  }

  const workspaceId = await resolveWorkspace({ url, apiKey, workspace: opts.workspace });

  const configDir = path.dirname(configPath);

  // Ensure config directory exists
  fs.mkdirSync(configDir, { recursive: true });

  // No `.mcp.json` written — see comment in handleClaudeCode. The m-notes MCP
  // endpoint was removed, so OpenClaw should hit the v1 HTTP API directly.
  const template = generateOpenClawTemplate({ url, workspaceId });
  writeInstructionBlock(configDir, "instructions.md", template);

  console.log("Connected. Your AI client is configured to use the m-notes v1 API.");
  console.log(`  ${path.join(configDir, "instructions.md")}  -> Agent instructions added`);
  console.log(`  API base   -> ${url}`);
  console.log(`  Workspace  -> ${workspaceId}`);
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

        if (target === "claude") {
          await handleClaude(opts);
          return;
        }

        if (target === "cursor") {
          await handleCursor(opts);
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
          process.stderr.write(`Unsupported target '${target}'. Supported: claude, cursor.\n`);
          process.exit(1);
          return;
        }


        // No target and no flag — show help
        connect.help();
      }
    );
}
