import { describe, it, expect, beforeEach, afterEach } from "vitest";
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
// AC-1.6: --list prints all available integration targets
// =============================================================
describe("mnotes connect --list", () => {
  it("prints all three integration targets with descriptions", async () => {
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
    expect(output).toContain("claude-code");
    expect(output).toContain("codex");
    expect(output).toContain("openclaw");

    // Each target has a description
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
    expect(output).toContain("claude-code");
    expect(output).toContain("not connected");
  });

  it("reports claude-code as connected when .mcp.json has m-notes server", async () => {
    const mcpConfig = {
      mcpServers: {
        "m-notes": {
          url: "http://localhost:3000/api/mcp",
        },
      },
    };
    fs.writeFileSync(
      path.join(tmpDir, ".mcp.json"),
      JSON.stringify(mcpConfig),
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

    expect(output).toMatch(/claude-code\s+connected/);
    expect(output).toContain("http://localhost:3000/api/mcp");
  });

  it("reports claude-code as connected when CLAUDE.md has m-notes block", async () => {
    const claudeMd = `# Project\n\n<!-- m-notes:start -->\nSome instructions\n<!-- m-notes:end -->\n`;
    fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), claudeMd, "utf-8");

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

    expect(output).toMatch(/claude-code\s+connected/);
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

  it("accepts --workspace flag without error", async () => {
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
        "--workspace",
        "ws-abc-123",
      ]);
    } finally {
      console.log = origLog;
    }

    expect(output).toContain("Available integrations:");
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

  it("returns all agents as not connected in empty directory", () => {
    const agents = detectConnectedAgents(tmpDir);
    expect(agents.get("claude-code")?.connected).toBe(false);
    expect(agents.get("codex")?.connected).toBe(false);
    expect(agents.get("openclaw")?.connected).toBe(false);
  });

  it("detects claude-code and codex from .mcp.json m-notes server", () => {
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
    expect(agents.get("claude-code")?.connected).toBe(true);
    expect(agents.get("claude-code")?.url).toBe("https://notes.example.com/api/mcp");
    expect(agents.get("codex")?.connected).toBe(true);
    expect(agents.get("codex")?.url).toBe("https://notes.example.com/api/mcp");
    expect(agents.get("openclaw")?.connected).toBe(false);
  });

  it("detects claude-code from CLAUDE.md block alone", () => {
    fs.writeFileSync(
      path.join(tmpDir, "CLAUDE.md"),
      "<!-- m-notes:start -->\nInstructions\n<!-- m-notes:end -->",
      "utf-8"
    );

    const agents = detectConnectedAgents(tmpDir);
    expect(agents.get("claude-code")?.connected).toBe(true);
    expect(agents.get("codex")?.connected).toBe(false);
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
