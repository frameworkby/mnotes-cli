import { readConfig } from "./commands/login";

export interface Config {
  apiKey: string;
  baseUrl: string;
  workspaceId?: string;
}

/**
 * Resolve workspace ID from (in priority order):
 * 1. MNOTES_WORKSPACE_ID env var
 * 2. Per-directory mapping in config (cwd → workspaceId, walking up parents)
 * 3. Global default workspaceId in config
 */
function resolveWorkspaceId(
  stored?: { workspaceId?: string; workspaces?: Record<string, string> },
): string | undefined {
  if (process.env.MNOTES_WORKSPACE_ID) return process.env.MNOTES_WORKSPACE_ID;

  // Check per-directory mapping
  if (stored?.workspaces) {
    const cwd = process.cwd();
    // Exact match first, then walk up parent directories
    let dir = cwd;
    while (true) {
      if (stored.workspaces[dir]) return stored.workspaces[dir];
      const parent = require("path").dirname(dir);
      if (parent === dir) break; // reached root
      dir = parent;
    }
  }

  return stored?.workspaceId;
}

export function resolveConfig(opts: {
  apiKey?: string;
  url?: string;
}): Config {
  const stored = readConfig();
  const apiKey = opts.apiKey || process.env.MNOTES_API_KEY || stored?.apiKey;
  if (!apiKey) {
    process.stderr.write(
      "Error: API key required. Use --api-key, set MNOTES_API_KEY, or run `mnotes login`\n"
    );
    process.exit(1);
  }

  const baseUrl = opts.url || process.env.MNOTES_URL || stored?.serverUrl || "https://mnotes.framework.by";
  const workspaceId = resolveWorkspaceId(stored ?? undefined);

  return { apiKey, baseUrl, workspaceId };
}
