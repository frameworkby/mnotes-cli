export interface Config {
  apiKey: string;
  baseUrl: string;
}

export function resolveConfig(opts: {
  apiKey?: string;
  url?: string;
}): Config {
  const apiKey = opts.apiKey || process.env.MNOTES_API_KEY;
  if (!apiKey) {
    process.stderr.write(
      "Error: API key required. Use --api-key or set MNOTES_API_KEY\n"
    );
    process.exit(1);
  }

  const baseUrl = opts.url || process.env.MNOTES_URL || "http://localhost:3000";

  return { apiKey, baseUrl };
}
