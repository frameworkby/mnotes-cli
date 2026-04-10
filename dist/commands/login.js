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
exports.configPath = configPath;
exports.readConfig = readConfig;
exports.writeConfig = writeConfig;
exports.maskKey = maskKey;
exports.startLocalServer = startLocalServer;
exports.registerLoginCommand = registerLoginCommand;
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const crypto = __importStar(require("crypto"));
const DEFAULT_URL = "https://mnotes.framework.by";
const LOGIN_TIMEOUT_MS = 120_000; // 2 minutes
/** Resolved at call time so tests can override HOME */
function configDir() {
    return path.join(os.homedir(), ".mnotes");
}
function configPath() {
    return path.join(configDir(), "config.json");
}
/**
 * Reads the stored config from ~/.mnotes/config.json.
 * Returns null if file doesn't exist or is invalid.
 */
function readConfig() {
    try {
        const raw = fs.readFileSync(configPath(), "utf-8");
        const parsed = JSON.parse(raw);
        if (typeof parsed.apiKey === "string" && typeof parsed.serverUrl === "string") {
            return {
                apiKey: parsed.apiKey,
                serverUrl: parsed.serverUrl,
                workspaceId: typeof parsed.workspaceId === "string" ? parsed.workspaceId : undefined,
            };
        }
        return null;
    }
    catch {
        return null;
    }
}
/**
 * Writes config to ~/.mnotes/config.json.
 */
function writeConfig(config) {
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
function maskKey(key) {
    if (key.length <= 12)
        return key;
    return `${key.slice(0, 8)}...${key.slice(-4)}`;
}
/**
 * Validates an API key by calling the server's health endpoint.
 */
async function validateKey(serverUrl, apiKey) {
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
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: message };
    }
}
/**
 * Browser login flow: start local server, open browser, wait for callback.
 */
async function browserLogin(serverUrl) {
    const state = crypto.randomBytes(32).toString("hex");
    // Start local callback server
    const { port, keyPromise, close } = await startLocalServer(state);
    const authUrl = `${serverUrl.replace(/\/+$/, "")}/auth/cli-callback?port=${port}&state=${state}`;
    // Try to open browser
    let browserOpened = false;
    try {
        const openModule = await Promise.resolve().then(() => __importStar(require("open")));
        const openFn = openModule.default ?? openModule;
        await openFn(authUrl);
        browserOpened = true;
    }
    catch {
        browserOpened = false;
    }
    if (browserOpened) {
        process.stderr.write("Opening browser for authentication...\n");
    }
    else {
        process.stderr.write("Could not open browser automatically.\n" +
            "Open this URL in your browser to authenticate:\n\n" +
            `  ${authUrl}\n\n`);
    }
    process.stderr.write("Waiting for authentication...\n");
    try {
        const key = await keyPromise;
        return key;
    }
    finally {
        close();
    }
}
/**
 * Starts the local HTTP server and returns port + a promise for the key.
 */
function startLocalServer(expectedState) {
    return new Promise((resolve, reject) => {
        let resolveKey;
        let rejectKey;
        const keyPromise = new Promise((res, rej) => {
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
            res.end("<html><body>" +
                "<h2>Login successful!</h2>" +
                "<p>You can close this tab and return to the terminal.</p>" +
                "</body></html>");
            resolveKey(key);
        });
        const timer = setTimeout(() => {
            server.close();
            rejectKey(new Error("Login timed out — no callback received within 2 minutes"));
        }, LOGIN_TIMEOUT_MS);
        server.listen(0, "127.0.0.1", () => {
            const addr = server.address();
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
function registerLoginCommand(program) {
    program
        .command("login")
        .description("Authenticate with m-notes server")
        .option("--api-key <key>", "Set API key directly (skip browser flow)")
        .option("--status", "Show current authentication status")
        .option("--url <url>", "Server URL (default: http://localhost:3000)")
        .action(async (opts) => {
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
            }
            else {
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            process.stderr.write(`Error: ${message}\n`);
            process.exit(1);
        }
    });
}
