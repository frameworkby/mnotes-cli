import * as fs from "fs";
import * as path from "path";

export interface ClaudeMdReadResult {
  exists: boolean;
  hasBlock: boolean;
  content: string | null;
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

export type ConnectionErrorKind = "auth" | "timeout" | "network";

export interface ConnectionFailure {
  ok: false;
  error: string;
  kind: ConnectionErrorKind;
}

export interface ConnectionSuccess {
  ok: true;
}

export type ConnectionResult = ConnectionSuccess | ConnectionFailure;

/**
 * Validates a connection to an m-notes instance by calling the health endpoint.
 * Returns ok=true on success, or a typed failure with a `kind` discriminant:
 *   - "auth"    — 401/403 response (expired or revoked token)
 *   - "timeout" — request timed out
 *   - "network" — any other network / HTTP error
 */
export async function validateConnection(
  url: string,
  apiKey: string
): Promise<ConnectionResult> {
  try {
    const healthUrl = `${url.replace(/\/+$/, "")}/api/health`;
    const res = await fetch(healthUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
        kind: "auth",
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
        kind: "network",
      };
    }

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // AbortSignal.timeout raises a DOMException with name "TimeoutError"
    const isTimeout =
      (err instanceof Error && err.name === "TimeoutError") ||
      message.toLowerCase().includes("timeout");
    return {
      ok: false,
      error: message,
      kind: isTimeout ? "timeout" : "network",
    };
  }
}

/**
 * Detects which agents are connected in a given directory by looking for the
 * m-notes instruction block in each agent's instruction file. Agents talk to
 * m-notes through the CLI / v1 API — there is no MCP config to inspect.
 */
export function detectConnectedAgents(dir: string): Map<string, { connected: boolean; url?: string }> {
  const agents = new Map<string, { connected: boolean; url?: string }>();

  // claude-code (legacy): instruction block in CLAUDE.md
  const claudeMd = readClaudeMdBlock(dir);
  agents.set("claude-code", {
    connected: claudeMd.hasBlock,
    url: extractServerUrl(claudeMd.content),
  });

  // codex: instruction block in AGENTS.md
  const codex = readInstructionBlock(dir, "AGENTS.md");
  agents.set("codex", { connected: codex.hasBlock, url: extractServerUrl(codex.content) });

  // openclaw: instruction block in instructions.md
  const openclaw = readInstructionBlock(dir, "instructions.md");
  agents.set("openclaw", { connected: openclaw.hasBlock, url: extractServerUrl(openclaw.content) });

  return agents;
}

// -- internal helpers --

/** Reads the m-notes instruction block from an arbitrary file in `dir`. */
function readInstructionBlock(dir: string, filename: string): ClaudeMdReadResult {
  const filePath = path.join(dir, filename);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const hasBlock = raw.includes(MNOTES_BLOCK_START) && raw.includes(MNOTES_BLOCK_END);
    return { exists: true, hasBlock, content: hasBlock ? extractBlock(raw) : null };
  } catch {
    return { exists: false, hasBlock: false, content: null };
  }
}

/** Pulls the server URL out of an instruction block (templates emit a "Server:" line). */
function extractServerUrl(blockContent: string | null): string | undefined {
  if (!blockContent) return undefined;
  const match = blockContent.match(/\*{0,2}Server\*{0,2}:\s*(\S+)/i);
  return match?.[1];
}

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
