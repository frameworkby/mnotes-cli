import { resolveConfig } from "../config";

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

type AgeHoursBucket = "0-6" | "6-24" | "24-72" | "72+";

export interface ConnectTelemetryOpts {
  event: string;
  target: "claude" | "cursor";
}

export interface DigestTelemetryOpts {
  event: "digest_note_opened";
  props: {
    source: "web" | "mcp" | "cli";
    age_hours: AgeHoursBucket;
    session_index: 1 | 2 | 3;
  };
}

/**
 * Send an anonymous telemetry event to the m-notes server, which forwards it
 * to Plausible. Errors are always swallowed — telemetry must never block or
 * error the caller's success path.
 *
 * Supports two shapes:
 *   - connect events: { event, target } — adds version automatically
 *   - digest events:  { event: "digest_note_opened", props: { source, age_hours, session_index } }
 */
export async function sendTelemetryEvent(
  opts: ConnectTelemetryOpts | DigestTelemetryOpts,
): Promise<void> {
  try {
    const config = resolveConfig({});
    const baseUrl = config.baseUrl.replace(/\/+$/, "").replace(/\/api\/mcp$/i, "");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TELEMETRY_TIMEOUT_MS);

    const body: Record<string, unknown> =
      "props" in opts
        ? { event: opts.event, props: opts.props }
        : { event: opts.event, target: opts.target, version: CLI_VERSION };

    try {
      await fetch(`${baseUrl}/api/telemetry/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    // Swallow all errors — telemetry is fire-and-forget
  }
}

/**
 * Bucket note age in hours from createdAt (ISO string) vs. now.
 */
export function bucketAgeHours(
  createdAt: string,
  now: Date = new Date(),
): AgeHoursBucket {
  const ageHours = Math.max(0, (now.getTime() - new Date(createdAt).getTime()) / 3_600_000);
  if (ageHours < 6) return "0-6";
  if (ageHours < 24) return "6-24";
  if (ageHours < 72) return "24-72";
  return "72+";
}

/**
 * Returns true when a note is a Daily Digest note.
 * Matches either folder name "Daily Digests" or title pattern.
 */
export function isDigestNote(opts: {
  folderName?: string | null;
  title: string;
}): boolean {
  if (opts.folderName === "Daily Digests") return true;
  return /^Daily Digest — \d{4}-\d{2}-\d{2}$/.test(opts.title);
}

/**
 * Process-local session counter for digest opens. In-memory, resets per
 * process — accurate for long-lived MCP servers; always 1 for short-lived
 * `mnotes read` invocations (which is correct: each invocation is session 1).
 */
let _digestOpenCount = 0;

export function nextDigestSessionIndex(): 1 | 2 | 3 {
  _digestOpenCount += 1;
  return _digestOpenCount >= 3 ? 3 : (_digestOpenCount as 1 | 2 | 3);
}

/** Reset counter — used by tests only. */
export function _resetDigestCounter(): void {
  _digestOpenCount = 0;
}
