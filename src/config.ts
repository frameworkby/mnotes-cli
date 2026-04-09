import { readConfig } from "./commands/login";

export interface Config {
  apiKey: string;
  baseUrl: string;
}

export function resolveConfig(opts: {
  apiKey?: string;
  url?: string;
}): Config {
  // Priority: CLI flag > env var > stored config from `mnotes login`
  const stored = readConfig();
  const apiKey = opts.apiKey || process.env.MNOTES_API_KEY || stored?.apiKey;
  if (!apiKey) {
    process.stderr.write(
      "Error: API key required. Use --api-key, set MNOTES_API_KEY, or run `mnotes login`\n"
    );
    process.exit(1);
  }

  const baseUrl = opts.url || process.env.MNOTES_URL || stored?.serverUrl || "http://localhost:3000";

  return { apiKey, baseUrl };
}
