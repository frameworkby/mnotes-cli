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
exports.readMcpJson = readMcpJson;
exports.writeMcpJson = writeMcpJson;
exports.readClaudeMdBlock = readClaudeMdBlock;
exports.writeClaudeMdBlock = writeClaudeMdBlock;
exports.writeInstructionBlock = writeInstructionBlock;
exports.validateConnection = validateConnection;
exports.detectConnectedAgents = detectConnectedAgents;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Safely reads and parses .mcp.json from the given directory.
 */
function readMcpJson(dir) {
    const filePath = path.join(dir, ".mcp.json");
    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        return { exists: true, config: parsed };
    }
    catch (err) {
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
function writeMcpJson(dir, serverEntry) {
    const filePath = path.join(dir, ".mcp.json");
    let existing = {};
    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        existing = JSON.parse(raw);
    }
    catch (err) {
        if (isNodeError(err) && err.code === "ENOENT") {
            // File doesn't exist — start fresh
        }
        else {
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
function readClaudeMdBlock(dir) {
    const filePath = path.join(dir, "CLAUDE.md");
    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const hasBlock = raw.includes(MNOTES_BLOCK_START) && raw.includes(MNOTES_BLOCK_END);
        return { exists: true, hasBlock, content: hasBlock ? extractBlock(raw) : null };
    }
    catch (err) {
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
function writeClaudeMdBlock(dir, content) {
    const filePath = path.join(dir, "CLAUDE.md");
    const block = `${MNOTES_BLOCK_START}\n${content}\n${MNOTES_BLOCK_END}`;
    let existing = "";
    try {
        existing = fs.readFileSync(filePath, "utf-8");
    }
    catch {
        // File doesn't exist — will create
    }
    if (existing.includes(MNOTES_BLOCK_START) && existing.includes(MNOTES_BLOCK_END)) {
        // Replace existing block
        const regex = new RegExp(`${escapeRegex(MNOTES_BLOCK_START)}[\\s\\S]*?${escapeRegex(MNOTES_BLOCK_END)}`);
        const updated = existing.replace(regex, block);
        fs.writeFileSync(filePath, updated, "utf-8");
    }
    else {
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
function writeInstructionBlock(dir, filename, content) {
    const filePath = path.join(dir, filename);
    const block = `${MNOTES_BLOCK_START}\n${content}\n${MNOTES_BLOCK_END}`;
    let existing = "";
    try {
        existing = fs.readFileSync(filePath, "utf-8");
    }
    catch {
        // File doesn't exist — will create
    }
    if (existing.includes(MNOTES_BLOCK_START) && existing.includes(MNOTES_BLOCK_END)) {
        const regex = new RegExp(`${escapeRegex(MNOTES_BLOCK_START)}[\\s\\S]*?${escapeRegex(MNOTES_BLOCK_END)}`);
        const updated = existing.replace(regex, block);
        fs.writeFileSync(filePath, updated, "utf-8");
    }
    else {
        const separator = existing.length > 0 && !existing.endsWith("\n") ? "\n\n" : "\n";
        const prefix = existing.length > 0 ? separator : "";
        fs.writeFileSync(filePath, existing + prefix + block + "\n", "utf-8");
    }
}
/**
 * Validates a connection to an m-notes instance by calling the health endpoint.
 * Returns ok=true on success, or a typed failure with a `kind` discriminant:
 *   - "auth"    — 401/403 response (expired or revoked token)
 *   - "timeout" — request timed out
 *   - "network" — any other network / HTTP error
 */
async function validateConnection(url, apiKey) {
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
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // AbortSignal.timeout raises a DOMException with name "TimeoutError"
        const isTimeout = (err instanceof Error && err.name === "TimeoutError") ||
            message.toLowerCase().includes("timeout");
        return {
            ok: false,
            error: message,
            kind: isTimeout ? "timeout" : "network",
        };
    }
}
/**
 * Detects which agents are connected in a given directory by reading config files.
 */
function detectConnectedAgents(dir) {
    const agents = new Map();
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
function extractBlock(content) {
    const startIdx = content.indexOf(MNOTES_BLOCK_START);
    const endIdx = content.indexOf(MNOTES_BLOCK_END);
    if (startIdx === -1 || endIdx === -1)
        return "";
    const blockStart = startIdx + MNOTES_BLOCK_START.length;
    return content.slice(blockStart, endIdx).trim();
}
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function isNodeError(err) {
    return err instanceof Error && "code" in err;
}
