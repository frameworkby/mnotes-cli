"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConfig = resolveConfig;
const login_1 = require("./commands/login");
/**
 * Resolve workspace ID from (in priority order):
 * 1. Explicit flag/option
 * 2. MNOTES_WORKSPACE_ID env var
 * 3. Per-directory mapping in config (cwd → workspaceId)
 * 4. Global default workspaceId in config
 */
function resolveWorkspaceId(explicit, stored) {
    if (explicit)
        return explicit;
    if (process.env.MNOTES_WORKSPACE_ID)
        return process.env.MNOTES_WORKSPACE_ID;
    // Check per-directory mapping
    if (stored?.workspaces) {
        const cwd = process.cwd();
        // Exact match first, then walk up parent directories
        let dir = cwd;
        while (true) {
            if (stored.workspaces[dir])
                return stored.workspaces[dir];
            const parent = require("path").dirname(dir);
            if (parent === dir)
                break; // reached root
            dir = parent;
        }
    }
    return stored?.workspaceId;
}
function resolveConfig(opts) {
    const stored = (0, login_1.readConfig)();
    const apiKey = opts.apiKey || process.env.MNOTES_API_KEY || stored?.apiKey;
    if (!apiKey) {
        process.stderr.write("Error: API key required. Use --api-key, set MNOTES_API_KEY, or run `mnotes login`\n");
        process.exit(1);
    }
    const baseUrl = opts.url || process.env.MNOTES_URL || stored?.serverUrl || "https://mnotes.framework.by";
    const workspaceId = resolveWorkspaceId(opts.workspaceId, stored ?? undefined);
    return { apiKey, baseUrl, workspaceId };
}
