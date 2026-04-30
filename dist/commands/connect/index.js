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
exports.handleClaudeCode = handleClaudeCode;
exports.registerConnectCommand = registerConnectCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const config_utils_1 = require("./config-utils");
const workspace_prompt_1 = require("./workspace-prompt");
const config_1 = require("../../config");
const client_1 = require("../../client");
const claude_code_1 = require("../../templates/claude-code");
const codex_1 = require("../../templates/codex");
const openclaw_1 = require("../../templates/openclaw");
const wizard_1 = require("./wizard");
/** Available integration targets with descriptions */
exports.INTEGRATION_TARGETS = [
    {
        name: "claude-code",
        description: "Connect Claude Code via MCP server config and CLAUDE.md instructions",
    },
    {
        name: "codex",
        description: "Connect OpenAI Codex via MCP config (experimental)",
    },
    {
        name: "openclaw",
        description: "Connect OpenClaw for mobile/conversational use",
    },
];
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
 * Resolves the workspace ID — uses --workspace flag if provided, otherwise
 * prompts interactively after validating the connection.
 *
 * When a workspace value is provided (flag, env, or config), validates it
 * against the API by matching on ID or slug. If not found, prompts to create.
 */
async function resolveWorkspace(opts) {
    // Check flag, env, dir map, global config
    const fromConfig = (0, config_1.resolveConfig)({ workspaceId: opts.workspace });
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
 * Handles the `claude-code` integration target.
 */
/**
 * Normalize the base URL: strip trailing slashes and /api/mcp suffix.
 * Users often pass the full MCP endpoint URL, but the code appends /api/mcp.
 */
function normalizeBaseUrl(raw) {
    return raw.replace(/\/+$/, "").replace(/\/api\/mcp$/i, "");
}
async function handleClaudeCode(opts) {
    const config = (0, config_1.resolveConfig)(opts);
    const url = normalizeBaseUrl(config.baseUrl);
    const apiKey = config.apiKey;
    const validation = await (0, config_utils_1.validateConnection)(url, apiKey);
    if (!validation.ok) {
        process.stderr.write(`Error: Cannot connect to ${url}: ${validation.error}\n`);
        process.exit(1);
    }
    const workspaceId = await resolveWorkspace({ url, apiKey, workspace: opts.workspace });
    const dir = process.cwd();
    const mcpUrl = `${url.replace(/\/+$/, "")}/api/mcp`;
    // Core setup — always runs
    (0, config_utils_1.writeMcpJson)(dir, {
        "m-notes": {
            type: "http",
            url: mcpUrl,
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        },
    });
    const template = (0, claude_code_1.generateClaudeCodeTemplate)({ url, workspaceId });
    (0, config_utils_1.writeClaudeMdBlock)(dir, template);
    console.log("Claude Code connected to m-notes!");
    console.log(`  .mcp.json  -> MCP server: ${mcpUrl}`);
    console.log(`  CLAUDE.md  -> Agent instructions added`);
    console.log(`  Workspace: ${workspaceId}`);
    // Wizard phase — scaffold optional extras
    if (opts.noWizard) {
        return;
    }
    let selectedItems;
    if (opts.all) {
        selectedItems = wizard_1.ALL_WIZARD_ITEMS;
    }
    else {
        selectedItems = await (0, wizard_1.promptWizardSelection)();
    }
    if (selectedItems.length === 0) {
        return;
    }
    const results = (0, wizard_1.scaffoldItems)(dir, selectedItems, { url, workspaceId });
    printScaffoldResults(results);
}
/**
 * Prints a summary of scaffolded files.
 */
function printScaffoldResults(results) {
    if (results.length === 0)
        return;
    console.log("\nExtras installed:");
    for (const result of results) {
        if (result.filesWritten.length === 0) {
            console.log(`  ${result.item}: skipped (existing files preserved)`);
        }
        else {
            for (const file of result.filesWritten) {
                console.log(`  ${result.item}: ${file}`);
            }
        }
    }
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
    (0, config_utils_1.writeMcpJson)(dir, mcpEntry);
    const template = (0, codex_1.generateCodexTemplate)({ url, workspaceId });
    (0, config_utils_1.writeInstructionBlock)(dir, "AGENTS.md", template);
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
async function handleOpenClaw(opts) {
    const config = (0, config_1.resolveConfig)(opts);
    const url = normalizeBaseUrl(config.baseUrl);
    const apiKey = config.apiKey;
    const configPath = opts.configPath || path.join(process.env.HOME || "~", ".openclaw", "mcp.json");
    const validation = await (0, config_utils_1.validateConnection)(url, apiKey);
    if (!validation.ok) {
        process.stderr.write(`Error: Cannot connect to ${url}: ${validation.error}\n`);
        process.exit(1);
    }
    const workspaceId = await resolveWorkspace({ url, apiKey, workspace: opts.workspace });
    const mcpUrl = `${url.replace(/\/+$/, "")}/api/mcp`;
    const configDir = path.dirname(configPath);
    // Ensure config directory exists
    fs.mkdirSync(configDir, { recursive: true });
    (0, config_utils_1.writeMcpJson)(configDir, {
        "openclaw-mnotes": {
            type: "http",
            url: mcpUrl,
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        },
    });
    const template = (0, openclaw_1.generateOpenClawTemplate)({ url, workspaceId });
    (0, config_utils_1.writeInstructionBlock)(configDir, "instructions.md", template);
    console.log("OpenClaw connected to m-notes!");
    console.log(`  ${path.join(configDir, ".mcp.json")}  -> MCP server: ${mcpUrl}`);
    console.log(`  ${path.join(configDir, "instructions.md")}  -> Agent instructions added`);
    console.log(`  Workspace: ${workspaceId}`);
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
        .option("--workspace <id>", "Workspace ID")
        .option("--config-path <path>", "Config file path (openclaw only)")
        .option("--no-wizard", "Skip the extras wizard (core setup only)")
        .option("--all", "Install all extras without prompting")
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
    });
}
