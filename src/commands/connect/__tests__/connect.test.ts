import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { registerConnectCommand, INTEGRATION_TARGETS } from "../index";
import {
  readMcpJson,
  writeMcpJson,
  readClaudeMdBlock,
  writeClaudeMdBlock,
  detectConnectedAgents,
} from "../config-utils";
import { generateCodexTemplate } from "../../../templates/codex";
import { generateOpenClawTemplate } from "../../../templates/openclaw";

// Mock createClient so resolveWorkspace can validate workspaces without a real server
vi.mock("../../../client", () => ({
  createClient: () => ({
    listWorkspaces: async () => ({
      data: [
        { id: "ws-123", name: "Test", slug: "test-123", isDefault: true },
        { id: "ws-explicit-id", name: "Explicit", slug: "explicit-id", isDefault: false },
        { id: "ws-new", name: "New", slug: "new", isDefault: false },
      ],
    }),
    createWorkspace: async (name: string) => ({
      data: { id: name, name, slug: name, isDefault: false },
    }),
  }),
}));

// -- Helper: capture stdout --
function captureStdout(fn: () => void): string {
  const chunks: string[] = [];
  const origWrite = process.stdout.write;
  process.stdout.write = (chunk: string | Uint8Array) => {
    chunks.push(typeof chunk === "string" ? chunk : chunk.toString());
    return true;
  };
  try {
    fn();
  } finally {
    process.stdout.write = origWrite;
  }
  return chunks.join("");
}

// -- Helper: create a temp directory for config file tests --
function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "mnotes-connect-test-"));
}

function cleanTmpDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

// =============================================================
// AC-1.6: --list prints available integration targets (codex, openclaw only)
// =============================================================
describe("mnotes connect --list", () => {
  it("prints active integration targets with descriptions, not claude-code", async () => {
    const program = new Command();
    program.exitOverride(); // throw instead of process.exit
    registerConnectCommand(program);

    let output = "";
    const origLog = console.log;
    console.log = (...args: unknown[]) => {
      output += args.join(" ") + "\n";
    };

    try {
      await program.parseAsync(["node", "mnotes", "connect", "--list"]);
    } finally {
      console.log = origLog;
    }

    expect(output).toContain("Available integrations:");
    expect(output).toContain("codex");
    expect(output).toContain("openclaw");
    expect(output).not.toContain("claude-code");

    // Each active target has a description
    for (const target of INTEGRATION_TARGETS) {
      expect(output).toContain(target.name);
      expect(output).toContain(target.description);
    }
  });
});

// =============================================================
// AC-1.7: --status reads config files and reports connected state
// =============================================================
describe("mnotes connect --status", () => {
  let tmpDir: string;
  let origCwd: () => string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    origCwd = process.cwd;
    process.cwd = () => tmpDir;
  });

  afterEach(() => {
    process.cwd = origCwd;
    cleanTmpDir(tmpDir);
  });

  it("reports all agents as not connected when no config files exist", async () => {
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    let output = "";
    const origLog = console.log;
    console.log = (...args: unknown[]) => {
      output += args.join(" ") + "\n";
    };

    try {
      await program.parseAsync(["node", "mnotes", "connect", "--status"]);
    } finally {
      console.log = origLog;
    }

    expect(output).toContain("Agent Connect Status");
    expect(output).toContain("not connected");
  });

  it("detects openclaw from openclaw-mnotes server in .mcp.json", async () => {
    fs.writeFileSync(
      path.join(tmpDir, ".mcp.json"),
      JSON.stringify({
        mcpServers: {
          "openclaw-mnotes": { url: "http://localhost:3000/api/mcp" },
        },
      }),
      "utf-8"
    );

    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    let output = "";
    const origLog = console.log;
    console.log = (...args: unknown[]) => {
      output += args.join(" ") + "\n";
    };

    try {
      await program.parseAsync(["node", "mnotes", "connect", "--status"]);
    } finally {
      console.log = origLog;
    }

    expect(output).toMatch(/openclaw\s+connected/);
    expect(output).toContain("http://localhost:3000/api/mcp");
  });
});

// =============================================================
// AC-1.8: --url and --api-key flags are accepted
// =============================================================
describe("mnotes connect flags", () => {
  it("accepts --url and --api-key flags without error", async () => {
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    let output = "";
    const origLog = console.log;
    console.log = (...args: unknown[]) => {
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
    } finally {
      console.log = origLog;
    }

    // The --list flag should still work with --url and --api-key present
    expect(output).toContain("Available integrations:");
  });

  it("rejects unknown --workspace flag (removed in v2)", async () => {
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

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
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    expect(errorMessage).toContain("unknown option");
  });
});

// =============================================================
// Config utilities — readMcpJson / writeMcpJson
// =============================================================
describe("config-utils: .mcp.json", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    cleanTmpDir(tmpDir);
  });

  it("readMcpJson returns exists=false when file missing", () => {
    const result = readMcpJson(tmpDir);
    expect(result.exists).toBe(false);
    expect(result.config).toBeNull();
  });

  it("readMcpJson parses valid .mcp.json", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".mcp.json"),
      JSON.stringify({ mcpServers: { test: { url: "http://test" } } }),
      "utf-8"
    );
    const result = readMcpJson(tmpDir);
    expect(result.exists).toBe(true);
    expect(result.config?.mcpServers?.test?.url).toBe("http://test");
  });

  it("readMcpJson returns error for invalid JSON", () => {
    fs.writeFileSync(path.join(tmpDir, ".mcp.json"), "not json{", "utf-8");
    const result = readMcpJson(tmpDir);
    expect(result.exists).toBe(true);
    expect(result.config).toBeNull();
    expect(result.error).toContain("Failed to parse");
  });

  it("writeMcpJson creates file when missing", () => {
    writeMcpJson(tmpDir, { "m-notes": { url: "http://localhost:3000/api/mcp" } });
    const content = JSON.parse(
      fs.readFileSync(path.join(tmpDir, ".mcp.json"), "utf-8")
    );
    expect(content.mcpServers["m-notes"].url).toBe(
      "http://localhost:3000/api/mcp"
    );
  });

  it("writeMcpJson merges into existing file", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".mcp.json"),
      JSON.stringify({
        mcpServers: { existing: { url: "http://other" } },
      }),
      "utf-8"
    );

    writeMcpJson(tmpDir, { "m-notes": { url: "http://localhost:3000/api/mcp" } });
    const content = JSON.parse(
      fs.readFileSync(path.join(tmpDir, ".mcp.json"), "utf-8")
    );
    expect(content.mcpServers.existing.url).toBe("http://other");
    expect(content.mcpServers["m-notes"].url).toBe(
      "http://localhost:3000/api/mcp"
    );
  });
});

// =============================================================
// Config utilities — CLAUDE.md block
// =============================================================
describe("config-utils: CLAUDE.md block", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    cleanTmpDir(tmpDir);
  });

  it("readClaudeMdBlock returns exists=false when file missing", () => {
    const result = readClaudeMdBlock(tmpDir);
    expect(result.exists).toBe(false);
    expect(result.hasBlock).toBe(false);
  });

  it("readClaudeMdBlock detects block when present", () => {
    fs.writeFileSync(
      path.join(tmpDir, "CLAUDE.md"),
      "# Proj\n\n<!-- m-notes:start -->\nInstructions here\n<!-- m-notes:end -->\n",
      "utf-8"
    );
    const result = readClaudeMdBlock(tmpDir);
    expect(result.exists).toBe(true);
    expect(result.hasBlock).toBe(true);
    expect(result.content).toBe("Instructions here");
  });

  it("readClaudeMdBlock returns hasBlock=false when no block", () => {
    fs.writeFileSync(
      path.join(tmpDir, "CLAUDE.md"),
      "# Proj\n\nNo m-notes block here.\n",
      "utf-8"
    );
    const result = readClaudeMdBlock(tmpDir);
    expect(result.exists).toBe(true);
    expect(result.hasBlock).toBe(false);
  });

  it("writeClaudeMdBlock creates file with block when missing", () => {
    writeClaudeMdBlock(tmpDir, "Use m-notes MCP server at http://localhost:3000");
    const content = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain("<!-- m-notes:start -->");
    expect(content).toContain("Use m-notes MCP server at http://localhost:3000");
    expect(content).toContain("<!-- m-notes:end -->");
  });

  it("writeClaudeMdBlock replaces existing block", () => {
    fs.writeFileSync(
      path.join(tmpDir, "CLAUDE.md"),
      "# Proj\n\n<!-- m-notes:start -->\nOld content\n<!-- m-notes:end -->\n\nOther stuff\n",
      "utf-8"
    );
    writeClaudeMdBlock(tmpDir, "New content");
    const content = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain("New content");
    expect(content).not.toContain("Old content");
    expect(content).toContain("Other stuff");
  });
});

// =============================================================
// Config utilities — detectConnectedAgents
// =============================================================
describe("config-utils: detectConnectedAgents", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    cleanTmpDir(tmpDir);
  });

  it("returns codex and openclaw as not connected in empty directory", () => {
    const agents = detectConnectedAgents(tmpDir);
    expect(agents.get("codex")?.connected).toBe(false);
    expect(agents.get("openclaw")?.connected).toBe(false);
  });

  it("detects codex from .mcp.json m-notes server", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".mcp.json"),
      JSON.stringify({
        mcpServers: {
          "m-notes": { url: "https://notes.example.com/api/mcp" },
        },
      }),
      "utf-8"
    );

    const agents = detectConnectedAgents(tmpDir);
    expect(agents.get("codex")?.connected).toBe(true);
    expect(agents.get("codex")?.url).toBe("https://notes.example.com/api/mcp");
    expect(agents.get("openclaw")?.connected).toBe(false);
  });

  it("detects openclaw from openclaw-mnotes server in .mcp.json", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".mcp.json"),
      JSON.stringify({
        mcpServers: {
          "openclaw-mnotes": { url: "https://notes.example.com/api/mcp" },
        },
      }),
      "utf-8"
    );

    const agents = detectConnectedAgents(tmpDir);
    expect(agents.get("openclaw")?.connected).toBe(true);
    expect(agents.get("openclaw")?.url).toBe("https://notes.example.com/api/mcp");
  });
});

// =============================================================
// Template generation — generateCodexTemplate (AC-6.3)
// =============================================================
describe("generateCodexTemplate", () => {
  it("includes url and workspaceId in output (AC-6.5)", () => {
    const result = generateCodexTemplate({
      url: "https://notes.example.com",
      workspaceId: "ws-abc-123",
    });

    expect(result).toContain("https://notes.example.com");
    expect(result).toContain("ws-abc-123");
  });

  it("has all lifecycle phases (AC-6.3)", () => {
    const result = generateCodexTemplate({
      url: "http://localhost:3000",
      workspaceId: "ws-test",
    });

    expect(result).toContain("Session Start");
    expect(result).toContain("Session End");
    expect(result).toContain("During Work");
    expect(result).toContain("project_context_load");
    expect(result).toContain("session_context_resume");
    expect(result).toContain("knowledge_store");
    expect(result).toContain("session_log");
  });

  it("includes all six key naming conventions (AC-6.2 / AC-6.3)", () => {
    const result = generateCodexTemplate({
      url: "http://localhost:3000",
      workspaceId: "ws-test",
    });

    expect(result).toContain("arch/{component}");
    expect(result).toContain("pattern/{name}");
    expect(result).toContain("bug/{id}");
    expect(result).toContain("dep/{package}");
    expect(result).toContain("decision/{topic}");
    expect(result).toContain("context/{area}");
  });

  it("includes all available MCP tools (AC-6.3)", () => {
    const result = generateCodexTemplate({
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
      expect(result).toContain(tool);
    }
  });
});

// =============================================================
// Template generation — generateOpenClawTemplate (AC-6.4)
// =============================================================
describe("generateOpenClawTemplate", () => {
  it("includes url and workspaceId in output (AC-6.5)", () => {
    const result = generateOpenClawTemplate({
      url: "https://notes.example.com",
      workspaceId: "ws-abc-123",
    });

    expect(result).toContain("https://notes.example.com");
    expect(result).toContain("ws-abc-123");
  });

  it("focuses on knowledge_store and recall_knowledge (AC-6.4)", () => {
    const result = generateOpenClawTemplate({
      url: "http://localhost:3000",
      workspaceId: "ws-test",
    });

    expect(result).toContain("knowledge_store");
    expect(result).toContain("recall_knowledge");
  });

  it("includes key naming conventions", () => {
    const result = generateOpenClawTemplate({
      url: "http://localhost:3000",
      workspaceId: "ws-test",
    });

    expect(result).toContain("decision/{topic}");
    expect(result).toContain("context/{area}");
    expect(result).toContain("bug/{id}");
    expect(result).toContain("pattern/{name}");
  });
});

// =============================================================
// Template storage — .ts files in correct directory (AC-6.6)
// =============================================================
describe("template storage (AC-6.6)", () => {
  it("codex and openclaw templates are importable as .ts modules", () => {
    expect(typeof generateCodexTemplate).toBe("function");
    expect(typeof generateOpenClawTemplate).toBe("function");
  });
});

// =============================================================
// mnotes connect claude-code — redirect to plugin (removed in v3)
// =============================================================
describe("mnotes connect claude-code (removed — redirects to plugin)", () => {
  let origExit: (code?: number) => never;
  let exitCode: number | undefined;

  beforeEach(() => {
    exitCode = undefined;
    origExit = process.exit;
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error(`process.exit(${code})`);
    }) as never;
  });

  afterEach(() => {
    process.exit = origExit;
    vi.restoreAllMocks();
  });

  it("prints plugin install instructions to stderr and exits 1", async () => {
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    let stderrOutput = "";
    const origStderrWrite = process.stderr.write;
    process.stderr.write = (chunk: string | Uint8Array) => {
      stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
      return true;
    };

    try {
      await program.parseAsync(["node", "mnotes", "connect", "claude-code"]);
    } catch {
      // Expected — process.exit throws
    } finally {
      process.stderr.write = origStderrWrite;
    }

    expect(exitCode).toBe(1);
    expect(stderrOutput).toContain("Install the Claude Code plugin instead");
    expect(stderrOutput).toContain("frameworkby/mnotes-claude-plugin");
    expect(stderrOutput).toContain("/mnotes:setup");
    expect(stderrOutput).toContain("docs/claude-code-plugin.md");
  });

  it("includes cleanup instructions for old scaffolded files", async () => {
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    let stderrOutput = "";
    const origStderrWrite = process.stderr.write;
    process.stderr.write = (chunk: string | Uint8Array) => {
      stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
      return true;
    };

    try {
      await program.parseAsync(["node", "mnotes", "connect", "claude-code"]);
    } catch {
      // Expected — process.exit throws
    } finally {
      process.stderr.write = origStderrWrite;
    }

    expect(stderrOutput).toContain(".claude/skills/mnotes-store");
    expect(stderrOutput).toContain("~/.claude/hooks/mnotes/");
    expect(stderrOutput).toContain(".claude/settings.json");
  });
});

// =============================================================
// Removed targets: connect claude / connect cursor (removed in v2.1)
// =============================================================
describe("mnotes connect <removed targets>", () => {
  let origExit: (code?: number) => never;
  let exitCode: number | undefined;

  beforeEach(() => {
    exitCode = undefined;
    origExit = process.exit;
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error(`process.exit(${code})`);
    }) as never;
  });

  afterEach(() => {
    process.exit = origExit;
    vi.restoreAllMocks();
  });

  it("exits with error and migration hint for 'connect claude' (removed in v2.1)", async () => {
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    let stderrOutput = "";
    const origStderrWrite = process.stderr.write;
    process.stderr.write = (chunk: string | Uint8Array) => {
      stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
      return true;
    };

    try {
      await program.parseAsync(["node", "mnotes", "connect", "claude"]);
    } catch {
      // Expected — process.exit throws
    } finally {
      process.stderr.write = origStderrWrite;
    }

    expect(exitCode).toBe(1);
    expect(stderrOutput).toContain("removed in v2.1");
    expect(stderrOutput).toContain("/api/mcp");
    expect(stderrOutput).toContain("~/.claude/mcp.json");
  });

  it("exits with error and migration hint for 'connect cursor' (removed in v2.1)", async () => {
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    let stderrOutput = "";
    const origStderrWrite = process.stderr.write;
    process.stderr.write = (chunk: string | Uint8Array) => {
      stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
      return true;
    };

    try {
      await program.parseAsync(["node", "mnotes", "connect", "cursor"]);
    } catch {
      // Expected — process.exit throws
    } finally {
      process.stderr.write = origStderrWrite;
    }

    expect(exitCode).toBe(1);
    expect(stderrOutput).toContain("removed in v2.1");
    expect(stderrOutput).toContain("/api/mcp");
    expect(stderrOutput).toContain("~/.cursor/mcp.json");
  });

  it("exits with error for unknown target with list of supported targets", async () => {
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    let stderrOutput = "";
    const origStderrWrite = process.stderr.write;
    process.stderr.write = (chunk: string | Uint8Array) => {
      stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
      return true;
    };

    try {
      await program.parseAsync(["node", "mnotes", "connect", "vscode"]);
    } catch {
      // Expected — process.exit throws
    } finally {
      process.stderr.write = origStderrWrite;
    }

    expect(exitCode).toBe(1);
    expect(stderrOutput).toContain("Unsupported target 'vscode'");
    expect(stderrOutput).toContain("codex");
    expect(stderrOutput).toContain("openclaw");
    // Must NOT list removed targets as supported
    expect(stderrOutput).not.toContain("Supported: claude, cursor");
  });

  it("removed targets do not appear in --list output", async () => {
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    let output = "";
    const origLog = console.log;
    console.log = (...args: unknown[]) => {
      output += args.join(" ") + "\n";
    };

    try {
      await program.parseAsync(["node", "mnotes", "connect", "--list"]);
    } finally {
      console.log = origLog;
    }

    // Active targets present
    expect(output).toContain("codex");
    expect(output).toContain("openclaw");
    // Removed targets absent
    expect(output).not.toContain("claude-code");
    expect(output).not.toMatch(/\bclaude\b(?!-code)/);
    expect(output).not.toContain("~/.cursor/mcp.json");
    expect(output).not.toContain("~/.claude/mcp.json");
  });
});
