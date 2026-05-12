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
const vitest_1 = require("vitest");
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const index_1 = require("../index");
const config_utils_1 = require("../config-utils");
const codex_1 = require("../../../templates/codex");
const openclaw_1 = require("../../../templates/openclaw");
// Mock createClient so resolveWorkspace can validate workspaces without a real server
vitest_1.vi.mock("../../../client", () => ({
    createClient: () => ({
        listWorkspaces: async () => ({
            data: [
                { id: "ws-123", name: "Test", slug: "test-123", isDefault: true },
                { id: "ws-explicit-id", name: "Explicit", slug: "explicit-id", isDefault: false },
                { id: "ws-new", name: "New", slug: "new", isDefault: false },
            ],
        }),
        createWorkspace: async (name) => ({
            data: { id: name, name, slug: name, isDefault: false },
        }),
    }),
}));
// -- Helper: capture stdout --
function captureStdout(fn) {
    const chunks = [];
    const origWrite = process.stdout.write;
    process.stdout.write = (chunk) => {
        chunks.push(typeof chunk === "string" ? chunk : chunk.toString());
        return true;
    };
    try {
        fn();
    }
    finally {
        process.stdout.write = origWrite;
    }
    return chunks.join("");
}
// -- Helper: create a temp directory for config file tests --
function makeTmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), "mnotes-connect-test-"));
}
function cleanTmpDir(dir) {
    fs.rmSync(dir, { recursive: true, force: true });
}
// =============================================================
// AC-1.6: --list prints available integration targets (codex, openclaw only)
// =============================================================
(0, vitest_1.describe)("mnotes connect --list", () => {
    (0, vitest_1.it)("prints active integration targets with descriptions, not claude-code", async () => {
        const program = new commander_1.Command();
        program.exitOverride(); // throw instead of process.exit
        (0, index_1.registerConnectCommand)(program);
        let output = "";
        const origLog = console.log;
        console.log = (...args) => {
            output += args.join(" ") + "\n";
        };
        try {
            await program.parseAsync(["node", "mnotes", "connect", "--list"]);
        }
        finally {
            console.log = origLog;
        }
        (0, vitest_1.expect)(output).toContain("Available integrations:");
        (0, vitest_1.expect)(output).toContain("codex");
        (0, vitest_1.expect)(output).toContain("openclaw");
        (0, vitest_1.expect)(output).not.toContain("claude-code");
        // Each active target has a description
        for (const target of index_1.INTEGRATION_TARGETS) {
            (0, vitest_1.expect)(output).toContain(target.name);
            (0, vitest_1.expect)(output).toContain(target.description);
        }
    });
});
// =============================================================
// AC-1.7: --status reads config files and reports connected state
// =============================================================
(0, vitest_1.describe)("mnotes connect --status", () => {
    let tmpDir;
    let origCwd;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
        origCwd = process.cwd;
        process.cwd = () => tmpDir;
    });
    (0, vitest_1.afterEach)(() => {
        process.cwd = origCwd;
        cleanTmpDir(tmpDir);
    });
    (0, vitest_1.it)("reports all agents as not connected when no config files exist", async () => {
        const program = new commander_1.Command();
        program.exitOverride();
        (0, index_1.registerConnectCommand)(program);
        let output = "";
        const origLog = console.log;
        console.log = (...args) => {
            output += args.join(" ") + "\n";
        };
        try {
            await program.parseAsync(["node", "mnotes", "connect", "--status"]);
        }
        finally {
            console.log = origLog;
        }
        (0, vitest_1.expect)(output).toContain("Agent Connect Status");
        (0, vitest_1.expect)(output).toContain("not connected");
    });
    (0, vitest_1.it)("detects openclaw from openclaw-mnotes server in .mcp.json", async () => {
        fs.writeFileSync(path.join(tmpDir, ".mcp.json"), JSON.stringify({
            mcpServers: {
                "openclaw-mnotes": { url: "http://localhost:3000/api/mcp" },
            },
        }), "utf-8");
        const program = new commander_1.Command();
        program.exitOverride();
        (0, index_1.registerConnectCommand)(program);
        let output = "";
        const origLog = console.log;
        console.log = (...args) => {
            output += args.join(" ") + "\n";
        };
        try {
            await program.parseAsync(["node", "mnotes", "connect", "--status"]);
        }
        finally {
            console.log = origLog;
        }
        (0, vitest_1.expect)(output).toMatch(/openclaw\s+connected/);
        (0, vitest_1.expect)(output).toContain("http://localhost:3000/api/mcp");
    });
});
// =============================================================
// AC-1.8: --url and --api-key flags are accepted
// =============================================================
(0, vitest_1.describe)("mnotes connect flags", () => {
    (0, vitest_1.it)("accepts --url and --api-key flags without error", async () => {
        const program = new commander_1.Command();
        program.exitOverride();
        (0, index_1.registerConnectCommand)(program);
        let output = "";
        const origLog = console.log;
        console.log = (...args) => {
            output += args.join(" ") + "\n";
        };
        try {
            await program.parseAsync([
                "node",
                "mnotes",
                "connect",
                "--list",
                "--url",
                "http://example.com",
                "--api-key",
                "test-key-123",
            ]);
        }
        finally {
            console.log = origLog;
        }
        // The --list flag should still work with --url and --api-key present
        (0, vitest_1.expect)(output).toContain("Available integrations:");
    });
    (0, vitest_1.it)("rejects unknown --workspace flag (removed in v2)", async () => {
        const program = new commander_1.Command();
        program.exitOverride();
        (0, index_1.registerConnectCommand)(program);
        let errorMessage = "";
        try {
            await program.parseAsync([
                "node",
                "mnotes",
                "connect",
                "--list",
                "--workspace",
                "ws-abc-123",
            ]);
        }
        catch (err) {
            errorMessage = err instanceof Error ? err.message : String(err);
        }
        (0, vitest_1.expect)(errorMessage).toContain("unknown option");
    });
});
// =============================================================
// Config utilities — readMcpJson / writeMcpJson
// =============================================================
(0, vitest_1.describe)("config-utils: .mcp.json", () => {
    let tmpDir;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
    });
    (0, vitest_1.afterEach)(() => {
        cleanTmpDir(tmpDir);
    });
    (0, vitest_1.it)("readMcpJson returns exists=false when file missing", () => {
        const result = (0, config_utils_1.readMcpJson)(tmpDir);
        (0, vitest_1.expect)(result.exists).toBe(false);
        (0, vitest_1.expect)(result.config).toBeNull();
    });
    (0, vitest_1.it)("readMcpJson parses valid .mcp.json", () => {
        fs.writeFileSync(path.join(tmpDir, ".mcp.json"), JSON.stringify({ mcpServers: { test: { url: "http://test" } } }), "utf-8");
        const result = (0, config_utils_1.readMcpJson)(tmpDir);
        (0, vitest_1.expect)(result.exists).toBe(true);
        (0, vitest_1.expect)(result.config?.mcpServers?.test?.url).toBe("http://test");
    });
    (0, vitest_1.it)("readMcpJson returns error for invalid JSON", () => {
        fs.writeFileSync(path.join(tmpDir, ".mcp.json"), "not json{", "utf-8");
        const result = (0, config_utils_1.readMcpJson)(tmpDir);
        (0, vitest_1.expect)(result.exists).toBe(true);
        (0, vitest_1.expect)(result.config).toBeNull();
        (0, vitest_1.expect)(result.error).toContain("Failed to parse");
    });
    (0, vitest_1.it)("writeMcpJson creates file when missing", () => {
        (0, config_utils_1.writeMcpJson)(tmpDir, { "m-notes": { url: "http://localhost:3000/api/mcp" } });
        const content = JSON.parse(fs.readFileSync(path.join(tmpDir, ".mcp.json"), "utf-8"));
        (0, vitest_1.expect)(content.mcpServers["m-notes"].url).toBe("http://localhost:3000/api/mcp");
    });
    (0, vitest_1.it)("writeMcpJson merges into existing file", () => {
        fs.writeFileSync(path.join(tmpDir, ".mcp.json"), JSON.stringify({
            mcpServers: { existing: { url: "http://other" } },
        }), "utf-8");
        (0, config_utils_1.writeMcpJson)(tmpDir, { "m-notes": { url: "http://localhost:3000/api/mcp" } });
        const content = JSON.parse(fs.readFileSync(path.join(tmpDir, ".mcp.json"), "utf-8"));
        (0, vitest_1.expect)(content.mcpServers.existing.url).toBe("http://other");
        (0, vitest_1.expect)(content.mcpServers["m-notes"].url).toBe("http://localhost:3000/api/mcp");
    });
});
// =============================================================
// Config utilities — CLAUDE.md block
// =============================================================
(0, vitest_1.describe)("config-utils: CLAUDE.md block", () => {
    let tmpDir;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
    });
    (0, vitest_1.afterEach)(() => {
        cleanTmpDir(tmpDir);
    });
    (0, vitest_1.it)("readClaudeMdBlock returns exists=false when file missing", () => {
        const result = (0, config_utils_1.readClaudeMdBlock)(tmpDir);
        (0, vitest_1.expect)(result.exists).toBe(false);
        (0, vitest_1.expect)(result.hasBlock).toBe(false);
    });
    (0, vitest_1.it)("readClaudeMdBlock detects block when present", () => {
        fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), "# Proj\n\n<!-- m-notes:start -->\nInstructions here\n<!-- m-notes:end -->\n", "utf-8");
        const result = (0, config_utils_1.readClaudeMdBlock)(tmpDir);
        (0, vitest_1.expect)(result.exists).toBe(true);
        (0, vitest_1.expect)(result.hasBlock).toBe(true);
        (0, vitest_1.expect)(result.content).toBe("Instructions here");
    });
    (0, vitest_1.it)("readClaudeMdBlock returns hasBlock=false when no block", () => {
        fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), "# Proj\n\nNo m-notes block here.\n", "utf-8");
        const result = (0, config_utils_1.readClaudeMdBlock)(tmpDir);
        (0, vitest_1.expect)(result.exists).toBe(true);
        (0, vitest_1.expect)(result.hasBlock).toBe(false);
    });
    (0, vitest_1.it)("writeClaudeMdBlock creates file with block when missing", () => {
        (0, config_utils_1.writeClaudeMdBlock)(tmpDir, "Use m-notes MCP server at http://localhost:3000");
        const content = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8");
        (0, vitest_1.expect)(content).toContain("<!-- m-notes:start -->");
        (0, vitest_1.expect)(content).toContain("Use m-notes MCP server at http://localhost:3000");
        (0, vitest_1.expect)(content).toContain("<!-- m-notes:end -->");
    });
    (0, vitest_1.it)("writeClaudeMdBlock replaces existing block", () => {
        fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), "# Proj\n\n<!-- m-notes:start -->\nOld content\n<!-- m-notes:end -->\n\nOther stuff\n", "utf-8");
        (0, config_utils_1.writeClaudeMdBlock)(tmpDir, "New content");
        const content = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8");
        (0, vitest_1.expect)(content).toContain("New content");
        (0, vitest_1.expect)(content).not.toContain("Old content");
        (0, vitest_1.expect)(content).toContain("Other stuff");
    });
});
// =============================================================
// Config utilities — detectConnectedAgents
// =============================================================
(0, vitest_1.describe)("config-utils: detectConnectedAgents", () => {
    let tmpDir;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
    });
    (0, vitest_1.afterEach)(() => {
        cleanTmpDir(tmpDir);
    });
    (0, vitest_1.it)("returns codex and openclaw as not connected in empty directory", () => {
        const agents = (0, config_utils_1.detectConnectedAgents)(tmpDir);
        (0, vitest_1.expect)(agents.get("codex")?.connected).toBe(false);
        (0, vitest_1.expect)(agents.get("openclaw")?.connected).toBe(false);
    });
    (0, vitest_1.it)("detects codex from .mcp.json m-notes server", () => {
        fs.writeFileSync(path.join(tmpDir, ".mcp.json"), JSON.stringify({
            mcpServers: {
                "m-notes": { url: "https://notes.example.com/api/mcp" },
            },
        }), "utf-8");
        const agents = (0, config_utils_1.detectConnectedAgents)(tmpDir);
        (0, vitest_1.expect)(agents.get("codex")?.connected).toBe(true);
        (0, vitest_1.expect)(agents.get("codex")?.url).toBe("https://notes.example.com/api/mcp");
        (0, vitest_1.expect)(agents.get("openclaw")?.connected).toBe(false);
    });
    (0, vitest_1.it)("detects openclaw from openclaw-mnotes server in .mcp.json", () => {
        fs.writeFileSync(path.join(tmpDir, ".mcp.json"), JSON.stringify({
            mcpServers: {
                "openclaw-mnotes": { url: "https://notes.example.com/api/mcp" },
            },
        }), "utf-8");
        const agents = (0, config_utils_1.detectConnectedAgents)(tmpDir);
        (0, vitest_1.expect)(agents.get("openclaw")?.connected).toBe(true);
        (0, vitest_1.expect)(agents.get("openclaw")?.url).toBe("https://notes.example.com/api/mcp");
    });
});
// =============================================================
// Template generation — generateCodexTemplate (AC-6.3)
// =============================================================
(0, vitest_1.describe)("generateCodexTemplate", () => {
    (0, vitest_1.it)("includes url and workspaceId in output (AC-6.5)", () => {
        const result = (0, codex_1.generateCodexTemplate)({
            url: "https://notes.example.com",
            workspaceId: "ws-abc-123",
        });
        (0, vitest_1.expect)(result).toContain("https://notes.example.com");
        (0, vitest_1.expect)(result).toContain("ws-abc-123");
    });
    (0, vitest_1.it)("has all lifecycle phases (AC-6.3)", () => {
        const result = (0, codex_1.generateCodexTemplate)({
            url: "http://localhost:3000",
            workspaceId: "ws-test",
        });
        (0, vitest_1.expect)(result).toContain("Session Start");
        (0, vitest_1.expect)(result).toContain("Session End");
        (0, vitest_1.expect)(result).toContain("During Work");
        (0, vitest_1.expect)(result).toContain("project_context_load");
        (0, vitest_1.expect)(result).toContain("session_context_resume");
        (0, vitest_1.expect)(result).toContain("knowledge_store");
        (0, vitest_1.expect)(result).toContain("session_log");
    });
    (0, vitest_1.it)("includes all six key naming conventions (AC-6.2 / AC-6.3)", () => {
        const result = (0, codex_1.generateCodexTemplate)({
            url: "http://localhost:3000",
            workspaceId: "ws-test",
        });
        (0, vitest_1.expect)(result).toContain("arch/{component}");
        (0, vitest_1.expect)(result).toContain("pattern/{name}");
        (0, vitest_1.expect)(result).toContain("bug/{id}");
        (0, vitest_1.expect)(result).toContain("dep/{package}");
        (0, vitest_1.expect)(result).toContain("decision/{topic}");
        (0, vitest_1.expect)(result).toContain("context/{area}");
    });
    (0, vitest_1.it)("includes all available MCP tools (AC-6.3)", () => {
        const result = (0, codex_1.generateCodexTemplate)({
            url: "http://localhost:3000",
            workspaceId: "ws-test",
        });
        const expectedTools = [
            "project_context_load",
            "session_context_resume",
            "knowledge_store",
            "recall_knowledge",
            "bulk_knowledge_recall",
            "knowledge_snapshot",
            "session_log",
            "context_fetch",
        ];
        for (const tool of expectedTools) {
            (0, vitest_1.expect)(result).toContain(tool);
        }
    });
});
// =============================================================
// Template generation — generateOpenClawTemplate (AC-6.4)
// =============================================================
(0, vitest_1.describe)("generateOpenClawTemplate", () => {
    (0, vitest_1.it)("includes url and workspaceId in output (AC-6.5)", () => {
        const result = (0, openclaw_1.generateOpenClawTemplate)({
            url: "https://notes.example.com",
            workspaceId: "ws-abc-123",
        });
        (0, vitest_1.expect)(result).toContain("https://notes.example.com");
        (0, vitest_1.expect)(result).toContain("ws-abc-123");
    });
    (0, vitest_1.it)("focuses on knowledge_store and recall_knowledge (AC-6.4)", () => {
        const result = (0, openclaw_1.generateOpenClawTemplate)({
            url: "http://localhost:3000",
            workspaceId: "ws-test",
        });
        (0, vitest_1.expect)(result).toContain("knowledge_store");
        (0, vitest_1.expect)(result).toContain("recall_knowledge");
    });
    (0, vitest_1.it)("includes key naming conventions", () => {
        const result = (0, openclaw_1.generateOpenClawTemplate)({
            url: "http://localhost:3000",
            workspaceId: "ws-test",
        });
        (0, vitest_1.expect)(result).toContain("decision/{topic}");
        (0, vitest_1.expect)(result).toContain("context/{area}");
        (0, vitest_1.expect)(result).toContain("bug/{id}");
        (0, vitest_1.expect)(result).toContain("pattern/{name}");
    });
});
// =============================================================
// Template storage — .ts files in correct directory (AC-6.6)
// =============================================================
(0, vitest_1.describe)("template storage (AC-6.6)", () => {
    (0, vitest_1.it)("codex and openclaw templates are importable as .ts modules", () => {
        (0, vitest_1.expect)(typeof codex_1.generateCodexTemplate).toBe("function");
        (0, vitest_1.expect)(typeof openclaw_1.generateOpenClawTemplate).toBe("function");
    });
});
// =============================================================
// mnotes connect claude-code — redirect to plugin (removed in v3)
// =============================================================
(0, vitest_1.describe)("mnotes connect claude-code (removed — redirects to plugin)", () => {
    let origExit;
    let exitCode;
    (0, vitest_1.beforeEach)(() => {
        exitCode = undefined;
        origExit = process.exit;
        process.exit = ((code) => {
            exitCode = code;
            throw new Error(`process.exit(${code})`);
        });
    });
    (0, vitest_1.afterEach)(() => {
        process.exit = origExit;
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)("prints plugin install instructions to stderr and exits 1", async () => {
        const program = new commander_1.Command();
        program.exitOverride();
        (0, index_1.registerConnectCommand)(program);
        let stderrOutput = "";
        const origStderrWrite = process.stderr.write;
        process.stderr.write = (chunk) => {
            stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
            return true;
        };
        try {
            await program.parseAsync(["node", "mnotes", "connect", "claude-code"]);
        }
        catch {
            // Expected — process.exit throws
        }
        finally {
            process.stderr.write = origStderrWrite;
        }
        (0, vitest_1.expect)(exitCode).toBe(1);
        (0, vitest_1.expect)(stderrOutput).toContain("Install the Claude Code plugin instead");
        (0, vitest_1.expect)(stderrOutput).toContain("frameworkby/mnotes-claude-plugin");
        (0, vitest_1.expect)(stderrOutput).toContain("/mnotes:setup");
        (0, vitest_1.expect)(stderrOutput).toContain("docs/claude-code-plugin.md");
    });
    (0, vitest_1.it)("includes cleanup instructions for old scaffolded files", async () => {
        const program = new commander_1.Command();
        program.exitOverride();
        (0, index_1.registerConnectCommand)(program);
        let stderrOutput = "";
        const origStderrWrite = process.stderr.write;
        process.stderr.write = (chunk) => {
            stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
            return true;
        };
        try {
            await program.parseAsync(["node", "mnotes", "connect", "claude-code"]);
        }
        catch {
            // Expected — process.exit throws
        }
        finally {
            process.stderr.write = origStderrWrite;
        }
        (0, vitest_1.expect)(stderrOutput).toContain(".claude/skills/mnotes-store");
        (0, vitest_1.expect)(stderrOutput).toContain("~/.claude/hooks/mnotes/");
        (0, vitest_1.expect)(stderrOutput).toContain(".claude/settings.json");
    });
});
// =============================================================
// Removed targets: connect claude / connect cursor (removed in v2.1)
// =============================================================
(0, vitest_1.describe)("mnotes connect <removed targets>", () => {
    let origExit;
    let exitCode;
    (0, vitest_1.beforeEach)(() => {
        exitCode = undefined;
        origExit = process.exit;
        process.exit = ((code) => {
            exitCode = code;
            throw new Error(`process.exit(${code})`);
        });
    });
    (0, vitest_1.afterEach)(() => {
        process.exit = origExit;
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)("exits with error and migration hint for 'connect claude' (removed in v2.1)", async () => {
        const program = new commander_1.Command();
        program.exitOverride();
        (0, index_1.registerConnectCommand)(program);
        let stderrOutput = "";
        const origStderrWrite = process.stderr.write;
        process.stderr.write = (chunk) => {
            stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
            return true;
        };
        try {
            await program.parseAsync(["node", "mnotes", "connect", "claude"]);
        }
        catch {
            // Expected — process.exit throws
        }
        finally {
            process.stderr.write = origStderrWrite;
        }
        (0, vitest_1.expect)(exitCode).toBe(1);
        (0, vitest_1.expect)(stderrOutput).toContain("removed in v2.1");
        (0, vitest_1.expect)(stderrOutput).toContain("/api/mcp");
        (0, vitest_1.expect)(stderrOutput).toContain("~/.claude/mcp.json");
    });
    (0, vitest_1.it)("exits with error and migration hint for 'connect cursor' (removed in v2.1)", async () => {
        const program = new commander_1.Command();
        program.exitOverride();
        (0, index_1.registerConnectCommand)(program);
        let stderrOutput = "";
        const origStderrWrite = process.stderr.write;
        process.stderr.write = (chunk) => {
            stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
            return true;
        };
        try {
            await program.parseAsync(["node", "mnotes", "connect", "cursor"]);
        }
        catch {
            // Expected — process.exit throws
        }
        finally {
            process.stderr.write = origStderrWrite;
        }
        (0, vitest_1.expect)(exitCode).toBe(1);
        (0, vitest_1.expect)(stderrOutput).toContain("removed in v2.1");
        (0, vitest_1.expect)(stderrOutput).toContain("/api/mcp");
        (0, vitest_1.expect)(stderrOutput).toContain("~/.cursor/mcp.json");
    });
    (0, vitest_1.it)("exits with error for unknown target with list of supported targets", async () => {
        const program = new commander_1.Command();
        program.exitOverride();
        (0, index_1.registerConnectCommand)(program);
        let stderrOutput = "";
        const origStderrWrite = process.stderr.write;
        process.stderr.write = (chunk) => {
            stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
            return true;
        };
        try {
            await program.parseAsync(["node", "mnotes", "connect", "vscode"]);
        }
        catch {
            // Expected — process.exit throws
        }
        finally {
            process.stderr.write = origStderrWrite;
        }
        (0, vitest_1.expect)(exitCode).toBe(1);
        (0, vitest_1.expect)(stderrOutput).toContain("Unsupported target 'vscode'");
        (0, vitest_1.expect)(stderrOutput).toContain("codex");
        (0, vitest_1.expect)(stderrOutput).toContain("openclaw");
        // Must NOT list removed targets as supported
        (0, vitest_1.expect)(stderrOutput).not.toContain("Supported: claude, cursor");
    });
    (0, vitest_1.it)("removed targets do not appear in --list output", async () => {
        const program = new commander_1.Command();
        program.exitOverride();
        (0, index_1.registerConnectCommand)(program);
        let output = "";
        const origLog = console.log;
        console.log = (...args) => {
            output += args.join(" ") + "\n";
        };
        try {
            await program.parseAsync(["node", "mnotes", "connect", "--list"]);
        }
        finally {
            console.log = origLog;
        }
        // Active targets present
        (0, vitest_1.expect)(output).toContain("codex");
        (0, vitest_1.expect)(output).toContain("openclaw");
        // Removed targets absent
        (0, vitest_1.expect)(output).not.toContain("claude-code");
        (0, vitest_1.expect)(output).not.toMatch(/\bclaude\b(?!-code)/);
        (0, vitest_1.expect)(output).not.toContain("~/.cursor/mcp.json");
        (0, vitest_1.expect)(output).not.toContain("~/.claude/mcp.json");
    });
});
