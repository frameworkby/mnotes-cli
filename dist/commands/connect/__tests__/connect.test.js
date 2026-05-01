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
const claude_code_1 = require("../../../templates/claude-code");
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
// AC-1.6: --list prints all available integration targets
// =============================================================
(0, vitest_1.describe)("mnotes connect --list", () => {
    (0, vitest_1.it)("prints all three integration targets with descriptions", async () => {
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
        (0, vitest_1.expect)(output).toContain("claude-code");
        (0, vitest_1.expect)(output).toContain("codex");
        (0, vitest_1.expect)(output).toContain("openclaw");
        // Each target has a description
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
        (0, vitest_1.expect)(output).toContain("claude-code");
        (0, vitest_1.expect)(output).toContain("not connected");
    });
    (0, vitest_1.it)("reports claude-code as connected when .mcp.json has m-notes server", async () => {
        const mcpConfig = {
            mcpServers: {
                "m-notes": {
                    url: "http://localhost:3000/api/mcp",
                },
            },
        };
        fs.writeFileSync(path.join(tmpDir, ".mcp.json"), JSON.stringify(mcpConfig), "utf-8");
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
        (0, vitest_1.expect)(output).toMatch(/claude-code\s+connected/);
        (0, vitest_1.expect)(output).toContain("http://localhost:3000/api/mcp");
    });
    (0, vitest_1.it)("reports claude-code as connected when CLAUDE.md has m-notes block", async () => {
        const claudeMd = `# Project\n\n<!-- m-notes:start -->\nSome instructions\n<!-- m-notes:end -->\n`;
        fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), claudeMd, "utf-8");
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
        (0, vitest_1.expect)(output).toMatch(/claude-code\s+connected/);
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
    (0, vitest_1.it)("accepts --workspace flag without error", async () => {
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
                "--workspace",
                "ws-abc-123",
            ]);
        }
        finally {
            console.log = origLog;
        }
        (0, vitest_1.expect)(output).toContain("Available integrations:");
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
    (0, vitest_1.it)("returns all agents as not connected in empty directory", () => {
        const agents = (0, config_utils_1.detectConnectedAgents)(tmpDir);
        (0, vitest_1.expect)(agents.get("claude-code")?.connected).toBe(false);
        (0, vitest_1.expect)(agents.get("codex")?.connected).toBe(false);
        (0, vitest_1.expect)(agents.get("openclaw")?.connected).toBe(false);
    });
    (0, vitest_1.it)("detects claude-code and codex from .mcp.json m-notes server", () => {
        fs.writeFileSync(path.join(tmpDir, ".mcp.json"), JSON.stringify({
            mcpServers: {
                "m-notes": { url: "https://notes.example.com/api/mcp" },
            },
        }), "utf-8");
        const agents = (0, config_utils_1.detectConnectedAgents)(tmpDir);
        (0, vitest_1.expect)(agents.get("claude-code")?.connected).toBe(true);
        (0, vitest_1.expect)(agents.get("claude-code")?.url).toBe("https://notes.example.com/api/mcp");
        (0, vitest_1.expect)(agents.get("codex")?.connected).toBe(true);
        (0, vitest_1.expect)(agents.get("codex")?.url).toBe("https://notes.example.com/api/mcp");
        (0, vitest_1.expect)(agents.get("openclaw")?.connected).toBe(false);
    });
    (0, vitest_1.it)("detects claude-code from CLAUDE.md block alone", () => {
        fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), "<!-- m-notes:start -->\nInstructions\n<!-- m-notes:end -->", "utf-8");
        const agents = (0, config_utils_1.detectConnectedAgents)(tmpDir);
        (0, vitest_1.expect)(agents.get("claude-code")?.connected).toBe(true);
        (0, vitest_1.expect)(agents.get("codex")?.connected).toBe(false);
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
// Template generation — generateClaudeCodeTemplate
// =============================================================
(0, vitest_1.describe)("generateClaudeCodeTemplate", () => {
    (0, vitest_1.it)("includes url and workspaceId in output", () => {
        const result = (0, claude_code_1.generateClaudeCodeTemplate)({
            url: "https://notes.example.com",
            workspaceId: "ws-abc-123",
        });
        (0, vitest_1.expect)(result).toContain("https://notes.example.com");
        (0, vitest_1.expect)(result).toContain("ws-abc-123");
    });
    (0, vitest_1.it)("includes session lifecycle tools and wiki framing", () => {
        const result = (0, claude_code_1.generateClaudeCodeTemplate)({
            url: "http://localhost:3000",
            workspaceId: "ws-test",
        });
        (0, vitest_1.expect)(result).toContain("living wiki");
        (0, vitest_1.expect)(result).toContain("Ingest Loop");
        (0, vitest_1.expect)(result).toContain("Lint Loop");
        (0, vitest_1.expect)(result).toContain("mnotes composite project-load");
        (0, vitest_1.expect)(result).toContain("mnotes session resume");
        (0, vitest_1.expect)(result).toContain("mnotes kb store");
        (0, vitest_1.expect)(result).toContain("mnotes session log");
    });
    (0, vitest_1.it)("includes all six key naming conventions (AC-6.2)", () => {
        const result = (0, claude_code_1.generateClaudeCodeTemplate)({
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
    (0, vitest_1.it)("includes all available MCP tools", () => {
        const result = (0, claude_code_1.generateClaudeCodeTemplate)({
            url: "http://localhost:3000",
            workspaceId: "ws-test",
        });
        const expectedTools = [
            "mnotes composite project-load",
            "mnotes session resume",
            "mnotes kb store",
            "mnotes kb recall",
            "mnotes bulk knowledge-recall",
            "mnotes kb snapshot",
            "mnotes kb scan-conflicts",
            "mnotes session log",
            "mnotes composite context-fetch",
            "mnotes note create",
            "mnotes note update",
            "mnotes note-ops append",
            "mnotes note search",
            "mnotes note-ops daily",
            "mnotes graph populate",
            "mnotes graph query-note",
        ];
        for (const tool of expectedTools) {
            (0, vitest_1.expect)(result).toContain(tool);
        }
    });
    (0, vitest_1.it)("does not reference phantom MCP tools", () => {
        const result = (0, claude_code_1.generateClaudeCodeTemplate)({
            url: "http://localhost:3000",
            workspaceId: "ws-test",
        });
        // These tool names don't exist in the MCP server — guard against regressions.
        (0, vitest_1.expect)(result).not.toMatch(/\bcreate_folder\b/);
        (0, vitest_1.expect)(result).not.toMatch(/\bmove_note\b/);
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
    (0, vitest_1.it)("is functionally equivalent to Claude Code — has all lifecycle phases (AC-6.3)", () => {
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
    (0, vitest_1.it)("is shorter than Claude Code template (AC-6.4)", () => {
        const claudeCode = (0, claude_code_1.generateClaudeCodeTemplate)({
            url: "http://localhost:3000",
            workspaceId: "ws-test",
        });
        const openclaw = (0, openclaw_1.generateOpenClawTemplate)({
            url: "http://localhost:3000",
            workspaceId: "ws-test",
        });
        (0, vitest_1.expect)(openclaw.length).toBeLessThan(claudeCode.length);
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
    (0, vitest_1.it)("all three templates are importable as .ts modules", () => {
        (0, vitest_1.expect)(typeof claude_code_1.generateClaudeCodeTemplate).toBe("function");
        (0, vitest_1.expect)(typeof codex_1.generateCodexTemplate).toBe("function");
        (0, vitest_1.expect)(typeof openclaw_1.generateOpenClawTemplate).toBe("function");
    });
});
// =============================================================
// mnotes connect claude-code subcommand
// =============================================================
(0, vitest_1.describe)("mnotes connect claude-code", () => {
    let tmpDir;
    let origCwd;
    let origExit;
    let exitCode;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
        origCwd = process.cwd;
        process.cwd = () => tmpDir;
        exitCode = undefined;
        origExit = process.exit;
        process.exit = ((code) => {
            exitCode = code;
            throw new Error(`process.exit(${code})`);
        });
    });
    (0, vitest_1.afterEach)(() => {
        process.cwd = origCwd;
        process.exit = origExit;
        cleanTmpDir(tmpDir);
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)("does not write .mcp.json (API key must not leak to project files, #594)", async () => {
        // Mock validateConnection to return ok
        const configUtils = await Promise.resolve().then(() => __importStar(require("../config-utils")));
        vitest_1.vi.spyOn(configUtils, "validateConnection").mockResolvedValue({ ok: true });
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
                "node", "mnotes", "connect", "claude-code",
                "--url", "http://localhost:3000",
                "--api-key", "test-key-abc",
                "--workspace", "ws-123",
                "--no-wizard",
            ]);
        }
        finally {
            console.log = origLog;
        }
        // .mcp.json must NOT be created — the m-notes MCP endpoint is removed,
        // and writing the API key into a project-level file is a leakage risk.
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".mcp.json"))).toBe(false);
        // Verify success output references v1 API, not MCP, and no API key leaks
        (0, vitest_1.expect)(output).toContain("Connected. Your AI client is configured to use the m-notes v1 API.");
        (0, vitest_1.expect)(output).toContain("ws-123");
        (0, vitest_1.expect)(output).not.toContain("/api/mcp");
        (0, vitest_1.expect)(output).not.toContain("test-key-abc");
    });
    (0, vitest_1.it)("writes CLAUDE.md with delimited block on success", async () => {
        const configUtils = await Promise.resolve().then(() => __importStar(require("../config-utils")));
        vitest_1.vi.spyOn(configUtils, "validateConnection").mockResolvedValue({ ok: true });
        const program = new commander_1.Command();
        program.exitOverride();
        (0, index_1.registerConnectCommand)(program);
        const origLog = console.log;
        console.log = () => { };
        try {
            await program.parseAsync([
                "node", "mnotes", "connect", "claude-code",
                "--url", "http://localhost:3000",
                "--api-key", "test-key-abc",
                "--workspace", "ws-123",
                "--no-wizard",
            ]);
        }
        finally {
            console.log = origLog;
        }
        const claudeMd = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8");
        (0, vitest_1.expect)(claudeMd).toContain("<!-- m-notes:start -->");
        (0, vitest_1.expect)(claudeMd).toContain("<!-- m-notes:end -->");
        (0, vitest_1.expect)(claudeMd).toContain("m-notes — Your Wiki");
        (0, vitest_1.expect)(claudeMd).toContain("ws-123");
    });
    (0, vitest_1.it)("replaces existing m-notes block on re-run", async () => {
        // Write existing CLAUDE.md with old block
        fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), "# My Project\n\n<!-- m-notes:start -->\nOld instructions\n<!-- m-notes:end -->\n\n## Other stuff\n", "utf-8");
        const configUtils = await Promise.resolve().then(() => __importStar(require("../config-utils")));
        vitest_1.vi.spyOn(configUtils, "validateConnection").mockResolvedValue({ ok: true });
        const program = new commander_1.Command();
        program.exitOverride();
        (0, index_1.registerConnectCommand)(program);
        const origLog = console.log;
        console.log = () => { };
        try {
            await program.parseAsync([
                "node", "mnotes", "connect", "claude-code",
                "--url", "http://localhost:3000",
                "--api-key", "test-key-abc",
                "--workspace", "ws-new",
                "--no-wizard",
            ]);
        }
        finally {
            console.log = origLog;
        }
        const claudeMd = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8");
        (0, vitest_1.expect)(claudeMd).not.toContain("Old instructions");
        (0, vitest_1.expect)(claudeMd).toContain("ws-new");
        (0, vitest_1.expect)(claudeMd).toContain("## Other stuff");
        (0, vitest_1.expect)(claudeMd).toContain("# My Project");
    });
    (0, vitest_1.it)("exits with error when --api-key is missing", async () => {
        // Ensure no stored config provides an API key (e.g. from a real local
        // ~/.mnotes/config.json on the developer's machine, or an env var).
        const loginModule = await Promise.resolve().then(() => __importStar(require("../../login")));
        vitest_1.vi.spyOn(loginModule, "readConfig").mockReturnValue(null);
        const origApiKey = process.env.MNOTES_API_KEY;
        const origUrl = process.env.MNOTES_URL;
        delete process.env.MNOTES_API_KEY;
        delete process.env.MNOTES_URL;
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
            await program.parseAsync([
                "node", "mnotes", "connect", "claude-code",
                "--workspace", "ws-123",
            ]);
        }
        catch {
            // Expected — process.exit throws
        }
        finally {
            process.stderr.write = origStderrWrite;
            if (origApiKey !== undefined)
                process.env.MNOTES_API_KEY = origApiKey;
            if (origUrl !== undefined)
                process.env.MNOTES_URL = origUrl;
        }
        (0, vitest_1.expect)(exitCode).toBe(1);
        (0, vitest_1.expect)(stderrOutput).toContain("API key required");
    });
    (0, vitest_1.it)("uses --workspace flag when provided (AC-5, no interactive prompt)", async () => {
        const configUtils = await Promise.resolve().then(() => __importStar(require("../config-utils")));
        vitest_1.vi.spyOn(configUtils, "validateConnection").mockResolvedValue({ ok: true });
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
                "node", "mnotes", "connect", "claude-code",
                "--url", "http://localhost:3000",
                "--api-key", "test-key",
                "--workspace", "ws-explicit-id",
                "--no-wizard",
            ]);
        }
        finally {
            console.log = origLog;
        }
        (0, vitest_1.expect)(output).toContain("ws-explicit-id");
        (0, vitest_1.expect)(output).toContain("Connected. Your AI client is configured to use the m-notes v1 API.");
    });
    (0, vitest_1.it)("exits with error when validation fails", async () => {
        const configUtils = await Promise.resolve().then(() => __importStar(require("../config-utils")));
        vitest_1.vi.spyOn(configUtils, "validateConnection").mockResolvedValue({
            ok: false,
            error: "Connection refused",
        });
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
            await program.parseAsync([
                "node", "mnotes", "connect", "claude-code",
                "--url", "http://localhost:3000",
                "--api-key", "test-key",
                "--workspace", "ws-123",
            ]);
        }
        catch {
            // Expected — process.exit throws
        }
        finally {
            process.stderr.write = origStderrWrite;
        }
        (0, vitest_1.expect)(exitCode).toBe(1);
        (0, vitest_1.expect)(stderrOutput).toContain("Cannot connect to");
        (0, vitest_1.expect)(stderrOutput).toContain("Connection refused");
    });
    (0, vitest_1.it)("normalizes trailing slashes in URL output", async () => {
        const configUtils = await Promise.resolve().then(() => __importStar(require("../config-utils")));
        vitest_1.vi.spyOn(configUtils, "validateConnection").mockResolvedValue({ ok: true });
        const program = new commander_1.Command();
        program.exitOverride();
        (0, index_1.registerConnectCommand)(program);
        const origLog = console.log;
        let output = "";
        console.log = (...args) => {
            output += args.join(" ") + "\n";
        };
        try {
            await program.parseAsync([
                "node", "mnotes", "connect", "claude-code",
                "--url", "http://localhost:3000///",
                "--api-key", "test-key-abc",
                "--workspace", "ws-123",
                "--no-wizard",
            ]);
        }
        finally {
            console.log = origLog;
        }
        // No .mcp.json written, and the printed API base has no trailing slashes.
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".mcp.json"))).toBe(false);
        (0, vitest_1.expect)(output).toContain("http://localhost:3000");
        (0, vitest_1.expect)(output).not.toMatch(/http:\/\/localhost:3000\/+\s/);
    });
});
