import { readConfig } from "./commands/login";

export interface Config {
  apiKey: string;
  baseUrl: string;
  workspaceId?: string;
}

export function resolveConfig(opts: {
  apiKey?: string;
  url?: string;
  workspaceId?: string;
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
  const workspaceId = opts.workspaceId || process.env.MNOTES_WORKSPACE_ID || stored?.workspaceId;

  return { apiKey, baseUrl, workspaceId };
}
