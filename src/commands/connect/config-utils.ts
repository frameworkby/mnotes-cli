import * as fs from "fs";
import * as path from "path";

/** Shape of .mcp.json — only the parts we care about */
export interface McpJsonConfig {
  mcpServers?: Record<
    string,
    {
      url?: string;
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      headers?: Record<string, string>;
      [key: string]: unknown;
    }
  >;
  [key: string]: unknown;
}

export interface McpReadResult {
  exists: boolean;
  config: McpJsonConfig | null;
  error?: string;
}

export interface ClaudeMdReadResult {
  exists: boolean;
  hasBlock: boolean;
  content: string | null;
}

/**
 * Safely reads and parses .mcp.json from the given directory.
 */
export function readMcpJson(dir: string): McpReadResult {
  const filePath = path.join(dir, ".mcp.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as McpJsonConfig;
    return { exists: true, config: parsed };
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "ENOENT") {
      return { exists: false, config: null };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { exists: true, config: null, error: `Failed to parse .mcp.json: ${message}` };
  }
}

/**
 * Merges an m-notes MCP server entry into .mcp.json at the given directory.
 * Creates the file if it doesn't exist.
 */
export function writeMcpJson(
  dir: string,
  serverEntry: McpJsonConfig["mcpServers"]
): void {
  const filePath = path.join(dir, ".mcp.json");
  let existing: McpJsonConfig = {};

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    existing = JSON.parse(raw) as McpJsonConfig;
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "ENOENT") {
      // File doesn't exist — start fresh
    } else {
      throw new Error(`Cannot write to .mcp.json: existing file has invalid JSON. Fix it manually or delete it.`);
    }
  }

  if (!existing.mcpServers) {
    existing.mcpServers = {};
  }

  Object.assign(existing.mcpServers, serverEntry);

  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
}

const MNOTES_BLOCK_START = "<!-- m-notes:start -->";
const MNOTES_BLOCK_END = "<!-- m-notes:end -->";

/**
 * Reads CLAUDE.md and checks for the m-notes instruction block.
 */
export function readClaudeMdBlock(dir: string): ClaudeMdReadResult {
  const filePath = path.join(dir, "CLAUDE.md");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const hasBlock =
      raw.includes(MNOTES_BLOCK_START) && raw.includes(MNOTES_BLOCK_END);
    return { exists: true, hasBlock, content: hasBlock ? extractBlock(raw) : null };
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "ENOENT") {
      return { exists: false, hasBlock: false, content: null };
    }
    return { exists: false, hasBlock: false, content: null };
  }
}

/**
 * Writes or replaces the m-notes instruction block in CLAUDE.md.
 * Creates the file if it doesn't exist.
 */
export function writeClaudeMdBlock(dir: string, content: string): void {
  const filePath = path.join(dir, "CLAUDE.md");
  const block = `${MNOTES_BLOCK_START}\n${content}\n${MNOTES_BLOCK_END}`;
  let existing = "";

  try {
    existing = fs.readFileSync(filePath, "utf-8");
  } catch {
    // File doesn't exist — will create
  }

  if (existing.includes(MNOTES_BLOCK_START) && existing.includes(MNOTES_BLOCK_END)) {
    // Replace existing block
    const regex = new RegExp(
      `${escapeRegex(MNOTES_BLOCK_START)}[\\s\\S]*?${escapeRegex(MNOTES_BLOCK_END)}`
    );
    const updated = existing.replace(regex, block);
    fs.writeFileSync(filePath, updated, "utf-8");
  } else {
    // Append block
    const separator = existing.length > 0 && !existing.endsWith("\n") ? "\n\n" : "\n";
    const prefix = existing.length > 0 ? separator : "";
    fs.writeFileSync(filePath, existing + prefix + block + "\n", "utf-8");
  }
}

/**
 * Writes or replaces the m-notes instruction block in any file (generalized).
 * Creates the file if it doesn't exist.
 */
export function writeInstructionBlock(dir: string, filename: string, content: string): void {
  const filePath = path.join(dir, filename);
  const block = `${MNOTES_BLOCK_START}\n${content}\n${MNOTES_BLOCK_END}`;
  let existing = "";

  try {
    existing = fs.readFileSync(filePath, "utf-8");
  } catch {
    // File doesn't exist — will create
  }

  if (existing.includes(MNOTES_BLOCK_START) && existing.includes(MNOTES_BLOCK_END)) {
    const regex = new RegExp(
      `${escapeRegex(MNOTES_BLOCK_START)}[\\s\\S]*?${escapeRegex(MNOTES_BLOCK_END)}`
    );
    const updated = existing.replace(regex, block);
    fs.writeFileSync(filePath, updated, "utf-8");
  } else {
    const separator = existing.length > 0 && !existing.endsWith("\n") ? "\n\n" : "\n";
    const prefix = existing.length > 0 ? separator : "";
    fs.writeFileSync(filePath, existing + prefix + block + "\n", "utf-8");
  }
}

/**
 * Validates a connection to an m-notes instance by calling the health endpoint.
 * Returns true if the server responds successfully.
 */
export async function validateConnection(
  url: string,
  apiKey: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const healthUrl = `${url.replace(/\/+$/, "")}/api/health`;
    const res = await fetch(healthUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

/**
 * Detects which agents are connected in a given directory by reading config files.
 */
export function detectConnectedAgents(dir: string): Map<string, { connected: boolean; url?: string }> {
  const agents = new Map<string, { connected: boolean; url?: string }>();

  // Read .mcp.json for MCP-based connections
  const mcpResult = readMcpJson(dir);
  const mcpServers = mcpResult.config?.mcpServers ?? {};
  const mnotesServer = mcpServers["m-notes"] ?? mcpServers["mnotes"] ?? null;
  const mnotesUrl = mnotesServer?.url ?? undefined;

  // Read CLAUDE.md for claude-code integration
  const claudeMd = readClaudeMdBlock(dir);

  // claude-code: connected if CLAUDE.md has m-notes block OR .mcp.json has m-notes server
  const claudeCodeConnected = claudeMd.hasBlock || mnotesServer !== null;
  agents.set("claude-code", {
    connected: claudeCodeConnected,
    url: claudeCodeConnected ? mnotesUrl : undefined,
  });

  // codex: connected if .mcp.json has m-notes server (codex uses MCP config)
  agents.set("codex", {
    connected: mnotesServer !== null,
    url: mnotesServer !== null ? mnotesUrl : undefined,
  });

  // openclaw: check for openclaw-specific config in .mcp.json
  const openclawServer = mcpServers["openclaw-mnotes"] ?? null;
  agents.set("openclaw", {
    connected: openclawServer !== null,
    url: openclawServer?.url ?? undefined,
  });

  return agents;
}

// -- internal helpers --

function extractBlock(content: string): string {
  const startIdx = content.indexOf(MNOTES_BLOCK_START);
  const endIdx = content.indexOf(MNOTES_BLOCK_END);
  if (startIdx === -1 || endIdx === -1) return "";
  const blockStart = startIdx + MNOTES_BLOCK_START.length;
  return content.slice(blockStart, endIdx).trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}
