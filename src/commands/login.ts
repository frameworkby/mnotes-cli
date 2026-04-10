import { Command } from "commander";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

/** Shape of ~/.mnotes/config.json */
export interface MnotesConfig {
  apiKey: string;
  serverUrl: string;
  workspaceId?: string;
}

const DEFAULT_URL = "https://mnotes.framework.by";
const LOGIN_TIMEOUT_MS = 120_000; // 2 minutes

/** Resolved at call time so tests can override HOME */
function configDir(): string {
  return path.join(os.homedir(), ".mnotes");
}

export function configPath(): string {
  return path.join(configDir(), "config.json");
}

/**
 * Reads the stored config from ~/.mnotes/config.json.
 * Returns null if file doesn't exist or is invalid.
 */
export function readConfig(): MnotesConfig | null {
  try {
    const raw = fs.readFileSync(configPath(), "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.apiKey === "string" && typeof parsed.serverUrl === "string") {
      return {
        apiKey: parsed.apiKey,
        serverUrl: parsed.serverUrl,
        workspaceId: typeof parsed.workspaceId === "string" ? parsed.workspaceId : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Writes config to ~/.mnotes/config.json.
 */
export function writeConfig(config: MnotesConfig): void {
  const dir = configDir();
  const filePath = configPath();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + "\n", "utf-8");
  // Restrict permissions to owner only
  fs.chmodSync(filePath, 0o600);
}

/**
 * Masks an API key for display: shows prefix + last 4 chars.
 * e.g. "mnk_abc...ef01"
 */
export function maskKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

/**
 * Validates an API key by calling the server's health endpoint.
 */
async function validateKey(
  serverUrl: string,
  apiKey: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${serverUrl.replace(/\/+$/, "")}/api/health`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
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
 * Browser login flow: start local server, open browser, wait for callback.
 */
async function browserLogin(serverUrl: string): Promise<string> {
  const state = crypto.randomBytes(32).toString("hex");

  // Start local callback server
  const { port, keyPromise, close } = await startLocalServer(state);

  const authUrl = `${serverUrl.replace(/\/+$/, "")}/auth/cli-callback?port=${port}&state=${state}`;

  // Try to open browser
  let browserOpened = false;
  try {
    const openModule = await import("open");
    const openFn = openModule.default ?? openModule;
    await (openFn as (url: string) => Promise<unknown>)(authUrl);
    browserOpened = true;
  } catch {
    browserOpened = false;
  }

  if (browserOpened) {
    process.stderr.write("Opening browser for authentication...\n");
  } else {
    process.stderr.write(
      "Could not open browser automatically.\n" +
        "Open this URL in your browser to authenticate:\n\n" +
        `  ${authUrl}\n\n`,
    );
  }

  process.stderr.write("Waiting for authentication...\n");

  try {
    const key = await keyPromise;
    return key;
  } finally {
    close();
  }
}

/**
 * Starts the local HTTP server and returns port + a promise for the key.
 */
export function startLocalServer(
  expectedState: string,
): Promise<{ port: number; keyPromise: Promise<string>; close: () => void }> {
  return new Promise((resolve, reject) => {
    let resolveKey: (key: string) => void;
    let rejectKey: (err: Error) => void;
    const keyPromise = new Promise<string>((res, rej) => {
      resolveKey = res;
      rejectKey = rej;
    });

    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url ?? "/", "http://localhost");

      if (reqUrl.pathname !== "/callback") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }

      const key = reqUrl.searchParams.get("key");
      const state = reqUrl.searchParams.get("state");

      if (!key || !state) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<html><body><h2>Error: Missing parameters</h2></body></html>");
        return;
      }

      if (state !== expectedState) {
        res.writeHead(403, { "Content-Type": "text/html" });
        res.end("<html><body><h2>Error: State mismatch (possible CSRF)</h2></body></html>");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        "<html><body>" +
          "<h2>Login successful!</h2>" +
          "<p>You can close this tab and return to the terminal.</p>" +
          "</body></html>",
      );

      resolveKey!(key);
    });

    const timer = setTimeout(() => {
      server.close();
      rejectKey!(new Error("Login timed out — no callback received within 2 minutes"));
    }, LOGIN_TIMEOUT_MS);

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as { port: number };
      resolve({
        port: addr.port,
        keyPromise,
        close: () => {
          clearTimeout(timer);
          server.close();
        },
      });
    });

    server.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start callback server: ${err.message}`));
    });
  });
}

export function registerLoginCommand(program: Command): void {
  program
    .command("login")
    .description("Authenticate with m-notes server")
    .option("--api-key <key>", "Set API key directly (skip browser flow)")
    .option("--status", "Show current authentication status")
    .option("--url <url>", "Server URL (default: http://localhost:3000)")
    .action(
      async (opts: {
        apiKey?: string;
        status?: boolean;
        url?: string;
      }) => {
        const serverUrl = opts.url
          ?? program.opts().url
          ?? process.env.MNOTES_URL
          ?? DEFAULT_URL;

        // --status: show current auth state
        if (opts.status) {
          const config = readConfig();
          if (!config) {
            process.stderr.write("Not logged in.\n");
            process.stderr.write(`Config file: ${configPath()} (not found)\n`);
            process.exit(1);
          }

          process.stderr.write(`Logged in to: ${config.serverUrl}\n`);
          process.stderr.write(`API key: ${maskKey(config.apiKey)}\n`);
          process.stderr.write(`Config file: ${configPath()}\n`);

          // Validate the key is still working
          process.stderr.write("Validating key...\n");
          const validation = await validateKey(config.serverUrl, config.apiKey);
          if (validation.ok) {
            process.stderr.write("Status: active\n");
          } else {
            process.stderr.write(`Status: invalid (${validation.error})\n`);
            process.exit(1);
          }
          return;
        }

        // --api-key: manual key entry
        if (opts.apiKey) {
          const key = opts.apiKey;
          if (!key.startsWith("mnk_")) {
            process.stderr.write("Error: API key must start with 'mnk_'\n");
            process.exit(1);
          }

          process.stderr.write("Validating API key...\n");
          const validation = await validateKey(serverUrl, key);
          if (!validation.ok) {
            process.stderr.write(`Error: Key validation failed — ${validation.error}\n`);
            process.exit(1);
          }

          writeConfig({ apiKey: key, serverUrl });
          process.stderr.write(`Logged in successfully!\n`);
          process.stderr.write(`API key: ${maskKey(key)}\n`);
          process.stderr.write(`Server: ${serverUrl}\n`);
          process.stderr.write(`Config saved to: ${configPath()}\n`);
          return;
        }

        // Default: browser login flow
        try {
          const key = await browserLogin(serverUrl);

          writeConfig({ apiKey: key, serverUrl });
          process.stderr.write(`\nLogged in successfully!\n`);
          process.stderr.write(`API key: ${maskKey(key)}\n`);
          process.stderr.write(`Server: ${serverUrl}\n`);
          process.stderr.write(`Config saved to: ${configPath()}\n`);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          process.stderr.write(`Error: ${message}\n`);
          process.exit(1);
        }
      },
    );
}
