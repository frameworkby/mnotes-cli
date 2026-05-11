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
    name: "claude-code",
    description:
      "Connect Claude Code project-level via CLAUDE.md instructions",
  },
  {
    name: "codex",
    description: "Connect OpenAI Codex via AGENTS.md instructions",
  },
  {
    name: "openclaw",
    description: "Connect OpenClaw for mobile/conversational use",
  },
] as const;

/** Targets removed in v2.1 that previously wrote a dead /api/mcp URL. */
const REMOVED_MCP_TARGETS = new Set(["claude", "cursor"]);

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
 * Resolves the workspace ID from env var, per-cwd config, or global config default.
 * Prompts interactively if no workspace is configured.
 *
 * When a workspace value is found (env/config), validates it against the API by
 * matching on ID or slug. If not found, prompts to create.
 */
async function resolveWorkspace(opts: {
  url: string;
  apiKey: string;
}): Promise<string> {
  // Check MNOTES_WORKSPACE_ID env, per-cwd map, global config default
  const fromConfig = resolveConfig({});
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
 * Handles the `claude-code` integration target.
 */
export async function handleClaudeCode(opts: {
  url?: string;
  apiKey?: string;
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

  const workspaceId = await resolveWorkspace({ url, apiKey, });

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

  const client = createClient(url, apiKey);
  const results = await scaffoldItems(dir, selectedItems, { url, workspaceId, client });
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
}): Promise<void> {
  const config = resolveConfig(opts);
  const url = normalizeBaseUrl(config.baseUrl);
  const apiKey = config.apiKey;

  const validation = await validateConnection(url, apiKey);
  if (!validation.ok) {
    process.stderr.write(`Error: Cannot connect to ${url}: ${validation.error}\n`);
    process.exit(1);
  }

  const workspaceId = await resolveWorkspace({ url, apiKey, });

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

  const workspaceId = await resolveWorkspace({ url, apiKey, });

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

        if (target && REMOVED_MCP_TARGETS.has(target)) {
          process.stderr.write(
            `Error: 'connect ${target}' was removed in v2.1 — it wrote a dead /api/mcp URL.\n` +
            `Use 'connect claude-code' instead (writes CLAUDE.md instructions, no MCP required).\n` +
            `If you previously ran 'connect ${target}', remove the stale 'm-notes' entry from\n` +
            `~/.${target}/mcp.json to avoid connection errors.\n`
          );
          process.exit(1);
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
          process.stderr.write(
            `Unsupported target '${target}'. Supported: ${INTEGRATION_TARGETS.map((t) => t.name).join(", ")}.\n`
          );
          process.exit(1);
          return;
        }


        // No target and no flag — show help
        connect.help();
      }
    );
}
