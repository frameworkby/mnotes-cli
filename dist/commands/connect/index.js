"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTEGRATION_TARGETS = void 0;
exports.registerConnectCommand = registerConnectCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const config_utils_1 = require("./config-utils");
const workspace_prompt_1 = require("./workspace-prompt");
const config_1 = require("../../config");
const client_1 = require("../../client");
const codex_1 = require("../../templates/codex");
const openclaw_1 = require("../../templates/openclaw");
/** Available integration targets with descriptions */
exports.INTEGRATION_TARGETS = [
    {
        name: "codex",
        description: "Connect OpenAI Codex via AGENTS.md instructions",
    },
    {
        name: "openclaw",
        description: "Connect OpenClaw for mobile/conversational use",
    },
];
/** Targets removed in v2.1 that previously wrote a dead /api/mcp URL. */
const REMOVED_MCP_TARGETS = new Set(["claude", "cursor"]);
/**
 * Prints the list of available integration targets.
 */
function printIntegrationList() {
    console.log("Available integrations:");
    const nameWidth = Math.max(...exports.INTEGRATION_TARGETS.map((t) => t.name.length));
    for (const target of exports.INTEGRATION_TARGETS) {
        console.log(`  ${target.name.padEnd(nameWidth)}    ${target.description}`);
    }
}
/**
 * Prints connection status for all agents in the current directory.
 */
function printConnectionStatus() {
    const dir = process.cwd();
    const agents = (0, config_utils_1.detectConnectedAgents)(dir);
    console.log("Agent Connect Status (current directory):");
    const nameWidth = Math.max(...exports.INTEGRATION_TARGETS.map((t) => t.name.length));
    const statusWidth = "not connected".length;
    for (const target of exports.INTEGRATION_TARGETS) {
        const info = agents.get(target.name);
        const connected = info?.connected ?? false;
        const status = connected ? "connected" : "not connected";
        const urlSuffix = connected && info?.url ? `    ${info.url}` : "";
        console.log(`  ${target.name.padEnd(nameWidth)}    ${status.padEnd(statusWidth)}${urlSuffix}`);
    }
}
/**
 * Resolves the workspace ID from env var, per-cwd config, or global config default.
 * Prompts interactively if no workspace is configured.
 *
 * When a workspace value is found (env/config), validates it against the API by
 * matching on ID or slug. If not found, prompts to create.
 */
async function resolveWorkspace(opts) {
    // Check MNOTES_WORKSPACE_ID env, per-cwd map, global config default
    const fromConfig = (0, config_1.resolveConfig)({});
    const candidate = fromConfig.workspaceId;
    if (candidate) {
        // Validate the candidate against the API
        const client = (0, client_1.createClient)(opts.url, opts.apiKey);
        let workspaces;
        try {
            const res = await client.listWorkspaces();
            workspaces = res.data;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(`Failed to fetch workspaces: ${message}`);
        }
        // Match by ID or slug
        const match = workspaces.find((ws) => ws.id === candidate || ws.slug === candidate);
        if (match) {
            return match.id;
        }
        // Not found — ask user to create
        process.stderr.write(`\nWorkspace "${candidate}" not found.\n`);
        const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
        const answer = await new Promise((resolve) => rl.question(`Create workspace "${candidate}"? [Y/n] `, resolve));
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
    const resolved = await (0, workspace_prompt_1.resolveWorkspaceInteractively)(opts.url, opts.apiKey);
    return resolved.id;
}
/**
 * Normalize the base URL: strip trailing slashes and any legacy /api/mcp suffix.
 * Earlier versions of the CLI pointed at the MCP endpoint directly; we accept
 * those URLs and reduce them back to the bare server origin.
 */
function normalizeBaseUrl(raw) {
    return raw.replace(/\/+$/, "").replace(/\/api\/mcp$/i, "");
}
/**
 * Prints a structured connection error to stderr and exits non-zero.
 * Provides actionable hints based on the error kind.
 */
function printConnectionError(url, validation) {
    if (validation.kind === "auth") {
        process.stderr.write(`Error: Authentication failed for ${url}: ${validation.error}\n`);
        process.stderr.write(`Hint: Run: npx mnotes auth login\n`);
    }
    else if (validation.kind === "timeout") {
        process.stderr.write(`Error: Connection to ${url} timed out: ${validation.error}\n`);
        process.stderr.write(`Hint: Check your network connection and try again.\n`);
    }
    else {
        process.stderr.write(`Error: Cannot connect to ${url}: ${validation.error}\n`);
    }
    process.exit(1);
}
/**
 * Handles the `codex` integration target.
 */
async function handleCodex(opts) {
    const config = (0, config_1.resolveConfig)(opts);
    const url = normalizeBaseUrl(config.baseUrl);
    const apiKey = config.apiKey;
    const validation = await (0, config_utils_1.validateConnection)(url, apiKey);
    if (!validation.ok) {
        printConnectionError(url, validation);
    }
    const workspaceId = await resolveWorkspace({ url, apiKey });
    const dir = process.cwd();
    // No `.mcp.json` written — the m-notes MCP endpoint was removed. The agent
    // talks to the v1 HTTP API, and the API key lives only in the CLI config
    // (`~/.mnotes/config.json`), never in a project-level file (#594).
    const template = (0, codex_1.generateCodexTemplate)({ url, workspaceId });
    (0, config_utils_1.writeInstructionBlock)(dir, "AGENTS.md", template);
    console.log("Connected. Your AI client is configured to use the m-notes v1 API.");
    console.log(`  AGENTS.md  -> Agent instructions added`);
    console.log(`  API base   -> ${url}`);
    console.log(`  Workspace  -> ${workspaceId}`);
}
/**
 * Handles the `openclaw` integration target.
 */
async function handleOpenClaw(opts) {
    const config = (0, config_1.resolveConfig)(opts);
    const url = normalizeBaseUrl(config.baseUrl);
    const apiKey = config.apiKey;
    const configPath = opts.configPath || path.join(process.env.HOME || "~", ".openclaw", "mcp.json");
    const validation = await (0, config_utils_1.validateConnection)(url, apiKey);
    if (!validation.ok) {
        printConnectionError(url, validation);
    }
    const workspaceId = await resolveWorkspace({ url, apiKey });
    const configDir = path.dirname(configPath);
    // Ensure config directory exists
    fs.mkdirSync(configDir, { recursive: true });
    // No `.mcp.json` written — the m-notes MCP endpoint was removed.
    // OpenClaw hits the v1 HTTP API directly.
    const template = (0, openclaw_1.generateOpenClawTemplate)({ url, workspaceId });
    (0, config_utils_1.writeInstructionBlock)(configDir, "instructions.md", template);
    console.log("Connected. Your AI client is configured to use the m-notes v1 API.");
    console.log(`  ${path.join(configDir, "instructions.md")}  -> Agent instructions added`);
    console.log(`  API base   -> ${url}`);
    console.log(`  Workspace  -> ${workspaceId}`);
}
/**
 * Registers the `connect` subcommand group on the root program.
 */
function registerConnectCommand(program) {
    const connect = program
        .command("connect [target]")
        .description("Connect coding agents to m-notes")
        .option("--list", "List available integration targets")
        .option("--status", "Show connection status for agents in current directory")
        .option("--url <url>", "m-notes URL (skip prompt)")
        .option("--api-key <key>", "API key (skip prompt)")
        .option("--config-path <path>", "Config file path (openclaw only)")
        .action(async (target, localOpts) => {
        // Merge parent program options (--api-key, --url) with subcommand options.
        // Commander v4 with passCommandToAction(false) passes parent-level flags
        // to the parent opts, not the subcommand opts.
        const globalOpts = program.opts();
        const opts = { ...localOpts };
        if (!opts.apiKey && globalOpts.apiKey)
            opts.apiKey = globalOpts.apiKey;
        if (!opts.url && globalOpts.url)
            opts.url = globalOpts.url;
        if (opts.list) {
            printIntegrationList();
            return;
        }
        if (opts.status) {
            printConnectionStatus();
            return;
        }
        if (target && REMOVED_MCP_TARGETS.has(target)) {
            process.stderr.write(`Error: 'connect ${target}' was removed in v2.1 — it wrote a dead /api/mcp URL.\n` +
                `If you previously ran 'connect ${target}', remove the stale 'm-notes' entry from\n` +
                `~/.${target}/mcp.json to avoid connection errors.\n`);
            process.exit(1);
            return;
        }
        if (target === "claude-code") {
            process.stderr.write("This command was removed. Install the Claude Code plugin instead:\n" +
                "\n" +
                "  /plugin marketplace add frameworkby/mnotes-claude-plugin\n" +
                "  /plugin install mnotes@mnotes\n" +
                "\n" +
                "Then run /mnotes:setup inside Claude Code.\n" +
                "\n" +
                "If you ran 'mnotes connect claude-code' previously, clean up the old scaffolded files:\n" +
                "  rm -rf .claude/skills/mnotes-store .claude/skills/mnotes-recall .claude/agents/knowledge-manager.md\n" +
                "  rm -rf ~/.claude/hooks/mnotes/\n" +
                "Also remove m-notes hook entries from .claude/settings.json (look for 'mnotes-*.sh' commands).\n" +
                "\n" +
                "Migration guide: https://github.com/frameworkby/remedy-pod-m-notes/blob/main/docs/claude-code-plugin.md\n");
            process.exit(1);
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
            process.stderr.write(`Unsupported target '${target}'. Supported: ${exports.INTEGRATION_TARGETS.map((t) => t.name).join(", ")}.\n`);
            process.exit(1);
            return;
        }
        // No target and no flag — show help
        connect.help();
    });
}
