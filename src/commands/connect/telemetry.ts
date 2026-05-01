import { resolveConfig } from "../../config";

// Read version once at module load time. The package.json is co-located with
// the compiled dist/ output (files: ["dist"] in package.json keeps package.json
// at the package root, not inside dist/), so we resolve from __dirname which
// may be packages/cli/dist/ in production or packages/cli/src/ in ts-node.
function readVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require("../../package.json") as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pkg = require("../../../package.json") as { version?: string };
      return pkg.version ?? "unknown";
    } catch {
      return "unknown";
    }
  }
}

const CLI_VERSION = readVersion();
const TELEMETRY_TIMEOUT_MS = 1500;

/**
 * Send an anonymous activation telemetry event to the m-notes server.
 * The server forwards it to Plausible. Errors are always swallowed —
 * telemetry must never block or error the CLI success path.
 */
export async function sendTelemetry(opts: {
  event: string;
  target: "claude" | "cursor";
}): Promise<void> {
  try {
    const config = resolveConfig({});
    const baseUrl = config.baseUrl.replace(/\/+$/, "").replace(/\/api\/mcp$/i, "");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TELEMETRY_TIMEOUT_MS);

    try {
      await fetch(`${baseUrl}/api/telemetry/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: opts.event,
          target: opts.target,
          version: CLI_VERSION,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    // Swallow all errors — telemetry is fire-and-forget
  }
}
