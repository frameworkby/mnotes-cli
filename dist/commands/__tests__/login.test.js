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
const vitest_1 = require("vitest");
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const login_1 = require("../login");
const config_1 = require("../../config");
function makeTmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), "mnotes-login-test-"));
}
function cleanTmpDir(dir) {
    fs.rmSync(dir, { recursive: true, force: true });
}
// =============================================================
// maskKey utility
// =============================================================
(0, vitest_1.describe)("maskKey", () => {
    (0, vitest_1.it)("masks a full API key showing prefix and last 4 chars", () => {
        const key = "mnk_abcdef1234567890abcdef1234567890abcdef12345678";
        const masked = (0, login_1.maskKey)(key);
        (0, vitest_1.expect)(masked).toBe("mnk_abcd...5678");
        (0, vitest_1.expect)(masked).not.toContain("1234567890");
    });
    (0, vitest_1.it)("returns short keys as-is", () => {
        (0, vitest_1.expect)((0, login_1.maskKey)("mnk_abc")).toBe("mnk_abc");
    });
});
// =============================================================
// readConfig / writeConfig
// =============================================================
(0, vitest_1.describe)("config file operations", () => {
    let tmpDir;
    let origHome;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
        origHome = process.env.HOME;
        process.env.HOME = tmpDir;
    });
    (0, vitest_1.afterEach)(() => {
        process.env.HOME = origHome;
        cleanTmpDir(tmpDir);
    });
    (0, vitest_1.it)("configPath resolves under HOME", () => {
        const p = (0, login_1.configPath)();
        (0, vitest_1.expect)(p).toBe(path.join(tmpDir, ".mnotes", "config.json"));
    });
    (0, vitest_1.it)("readConfig returns null when no config file exists", () => {
        (0, vitest_1.expect)((0, login_1.readConfig)()).toBeNull();
    });
    (0, vitest_1.it)("writeConfig creates config file and readConfig reads it back", () => {
        (0, login_1.writeConfig)({ apiKey: "mnk_testkey123", serverUrl: "http://localhost:3000" });
        const config = (0, login_1.readConfig)();
        (0, vitest_1.expect)(config).not.toBeNull();
        (0, vitest_1.expect)(config.apiKey).toBe("mnk_testkey123");
        (0, vitest_1.expect)(config.serverUrl).toBe("http://localhost:3000");
    });
    (0, vitest_1.it)("writeConfig creates .mnotes directory if missing", () => {
        const mnotesDir = path.join(tmpDir, ".mnotes");
        (0, vitest_1.expect)(fs.existsSync(mnotesDir)).toBe(false);
        (0, login_1.writeConfig)({ apiKey: "mnk_test", serverUrl: "http://localhost:3000" });
        (0, vitest_1.expect)(fs.existsSync(mnotesDir)).toBe(true);
    });
    (0, vitest_1.it)("writeConfig sets restrictive file permissions (0o600)", () => {
        (0, login_1.writeConfig)({ apiKey: "mnk_test", serverUrl: "http://localhost:3000" });
        const p = (0, login_1.configPath)();
        const stats = fs.statSync(p);
        const mode = stats.mode & 0o777;
        (0, vitest_1.expect)(mode).toBe(0o600);
    });
    (0, vitest_1.it)("readConfig returns null for invalid JSON", () => {
        const mnotesDir = path.join(tmpDir, ".mnotes");
        fs.mkdirSync(mnotesDir, { recursive: true });
        fs.writeFileSync(path.join(mnotesDir, "config.json"), "not json{", "utf-8");
        (0, vitest_1.expect)((0, login_1.readConfig)()).toBeNull();
    });
    (0, vitest_1.it)("readConfig returns null for config missing required fields", () => {
        const mnotesDir = path.join(tmpDir, ".mnotes");
        fs.mkdirSync(mnotesDir, { recursive: true });
        fs.writeFileSync(path.join(mnotesDir, "config.json"), JSON.stringify({ apiKey: "mnk_test" }), "utf-8");
        (0, vitest_1.expect)((0, login_1.readConfig)()).toBeNull();
    });
});
// =============================================================
// mnotes login --status (AC-7)
// =============================================================
(0, vitest_1.describe)("mnotes login --status", () => {
    let tmpDir;
    let origHome;
    let origExit;
    let exitCode;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
        origHome = process.env.HOME;
        process.env.HOME = tmpDir;
        exitCode = undefined;
        origExit = process.exit;
        process.exit = ((code) => {
            exitCode = code;
            throw new Error(`process.exit(${code})`);
        });
    });
    (0, vitest_1.afterEach)(() => {
        process.env.HOME = origHome;
        process.exit = origExit;
        cleanTmpDir(tmpDir);
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)("reports not logged in when no config exists", async () => {
        const program = new commander_1.Command();
        program.exitOverride();
        (0, login_1.registerLoginCommand)(program);
        let stderrOutput = "";
        const origWrite = process.stderr.write;
        process.stderr.write = (chunk) => {
            stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
            return true;
        };
        try {
            await program.parseAsync(["node", "mnotes", "login", "--status"]);
        }
        catch {
            // Expected — process.exit throws
        }
        finally {
            process.stderr.write = origWrite;
        }
        (0, vitest_1.expect)(exitCode).toBe(1);
        (0, vitest_1.expect)(stderrOutput).toContain("Not logged in");
    });
    (0, vitest_1.it)("shows stored config and validates key when logged in", async () => {
        (0, login_1.writeConfig)({
            apiKey: "mnk_abcdef1234567890abcdef1234567890abcdef12345678",
            serverUrl: "http://localhost:3000",
        });
        const program = new commander_1.Command();
        program.exitOverride();
        (0, login_1.registerLoginCommand)(program);
        let stderrOutput = "";
        const origWrite = process.stderr.write;
        process.stderr.write = (chunk) => {
            stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
            return true;
        };
        const origFetch = global.fetch;
        global.fetch = vitest_1.vi.fn().mockResolvedValue({ ok: true });
        try {
            await program.parseAsync(["node", "mnotes", "login", "--status"]);
        }
        catch {
            // may exit
        }
        finally {
            process.stderr.write = origWrite;
            global.fetch = origFetch;
        }
        (0, vitest_1.expect)(stderrOutput).toContain("http://localhost:3000");
        (0, vitest_1.expect)(stderrOutput).toContain("mnk_abcd...5678");
        (0, vitest_1.expect)(stderrOutput).toContain("active");
    });
    (0, vitest_1.it)("reports invalid when server rejects the key", async () => {
        (0, login_1.writeConfig)({
            apiKey: "mnk_abcdef1234567890abcdef1234567890abcdef12345678",
            serverUrl: "http://localhost:3000",
        });
        const program = new commander_1.Command();
        program.exitOverride();
        (0, login_1.registerLoginCommand)(program);
        let stderrOutput = "";
        const origWrite = process.stderr.write;
        process.stderr.write = (chunk) => {
            stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
            return true;
        };
        const origFetch = global.fetch;
        global.fetch = vitest_1.vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            statusText: "Unauthorized",
        });
        try {
            await program.parseAsync(["node", "mnotes", "login", "--status"]);
        }
        catch {
            // expected
        }
        finally {
            process.stderr.write = origWrite;
            global.fetch = origFetch;
        }
        (0, vitest_1.expect)(exitCode).toBe(1);
        (0, vitest_1.expect)(stderrOutput).toContain("invalid");
    });
});
// =============================================================
// mnotes login --api-key (AC-6: manual fallback)
// =============================================================
(0, vitest_1.describe)("mnotes login --api-key", () => {
    let tmpDir;
    let origHome;
    let origExit;
    let exitCode;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
        origHome = process.env.HOME;
        process.env.HOME = tmpDir;
        exitCode = undefined;
        origExit = process.exit;
        process.exit = ((code) => {
            exitCode = code;
            throw new Error(`process.exit(${code})`);
        });
    });
    (0, vitest_1.afterEach)(() => {
        process.env.HOME = origHome;
        process.exit = origExit;
        cleanTmpDir(tmpDir);
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)("rejects keys without mnk_ prefix", async () => {
        const program = new commander_1.Command();
        program.exitOverride();
        (0, login_1.registerLoginCommand)(program);
        let stderrOutput = "";
        const origWrite = process.stderr.write;
        process.stderr.write = (chunk) => {
            stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
            return true;
        };
        try {
            await program.parseAsync(["node", "mnotes", "login", "--api-key", "bad_key"]);
        }
        catch {
            // Expected
        }
        finally {
            process.stderr.write = origWrite;
        }
        (0, vitest_1.expect)(exitCode).toBe(1);
        (0, vitest_1.expect)(stderrOutput).toContain("must start with 'mnk_'");
    });
    (0, vitest_1.it)("saves valid key to config after successful validation", async () => {
        const program = new commander_1.Command();
        program.exitOverride();
        (0, login_1.registerLoginCommand)(program);
        let stderrOutput = "";
        const origWrite = process.stderr.write;
        process.stderr.write = (chunk) => {
            stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
            return true;
        };
        const origFetch = global.fetch;
        global.fetch = vitest_1.vi.fn().mockResolvedValue({ ok: true });
        try {
            await program.parseAsync([
                "node", "mnotes", "login",
                "--api-key", "mnk_validkey1234567890abcdef",
                "--url", "https://notes.example.com",
            ]);
        }
        finally {
            process.stderr.write = origWrite;
            global.fetch = origFetch;
        }
        (0, vitest_1.expect)(stderrOutput).toContain("Logged in successfully");
        (0, vitest_1.expect)(stderrOutput).toContain("https://notes.example.com");
        const config = (0, login_1.readConfig)();
        (0, vitest_1.expect)(config).not.toBeNull();
        (0, vitest_1.expect)(config.apiKey).toBe("mnk_validkey1234567890abcdef");
        (0, vitest_1.expect)(config.serverUrl).toBe("https://notes.example.com");
    });
    (0, vitest_1.it)("fails when server validation returns error", async () => {
        const program = new commander_1.Command();
        program.exitOverride();
        (0, login_1.registerLoginCommand)(program);
        let stderrOutput = "";
        const origWrite = process.stderr.write;
        process.stderr.write = (chunk) => {
            stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
            return true;
        };
        const origFetch = global.fetch;
        global.fetch = vitest_1.vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            statusText: "Unauthorized",
        });
        try {
            await program.parseAsync(["node", "mnotes", "login", "--api-key", "mnk_bad123"]);
        }
        catch {
            // Expected
        }
        finally {
            process.stderr.write = origWrite;
            global.fetch = origFetch;
        }
        (0, vitest_1.expect)(exitCode).toBe(1);
        (0, vitest_1.expect)(stderrOutput).toContain("Key validation failed");
    });
});
// =============================================================
// Local callback server (AC-2, AC-3)
// =============================================================
(0, vitest_1.describe)("startLocalServer", () => {
    (0, vitest_1.it)("starts on a random port and resolves key on valid callback", async () => {
        const state = "a".repeat(64);
        const { port, keyPromise, close } = await (0, login_1.startLocalServer)(state);
        (0, vitest_1.expect)(port).toBeGreaterThan(0);
        (0, vitest_1.expect)(port).toBeLessThanOrEqual(65535);
        // Simulate the web app redirecting back
        const testKey = "mnk_callbacktestkey1234567890";
        const res = await fetch(`http://127.0.0.1:${port}/callback?key=${testKey}&state=${state}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        const key = await keyPromise;
        (0, vitest_1.expect)(key).toBe(testKey);
        close();
    });
    (0, vitest_1.it)("returns 403 for mismatched state (CSRF protection)", async () => {
        const state = "b".repeat(64);
        const { port, keyPromise, close } = await (0, login_1.startLocalServer)(state);
        const res = await fetch(`http://127.0.0.1:${port}/callback?key=mnk_test&state=wrongstate`);
        (0, vitest_1.expect)(res.status).toBe(403);
        // Send valid callback to clean up
        await fetch(`http://127.0.0.1:${port}/callback?key=mnk_test&state=${state}`);
        await keyPromise;
        close();
    });
    (0, vitest_1.it)("returns 400 for missing parameters", async () => {
        const state = "c".repeat(64);
        const { port, keyPromise, close } = await (0, login_1.startLocalServer)(state);
        const res = await fetch(`http://127.0.0.1:${port}/callback`);
        (0, vitest_1.expect)(res.status).toBe(400);
        // Clean up
        await fetch(`http://127.0.0.1:${port}/callback?key=mnk_test&state=${state}`);
        await keyPromise;
        close();
    });
    (0, vitest_1.it)("returns 404 for non-callback paths", async () => {
        const state = "d".repeat(64);
        const { port, keyPromise, close } = await (0, login_1.startLocalServer)(state);
        const res = await fetch(`http://127.0.0.1:${port}/other`);
        (0, vitest_1.expect)(res.status).toBe(404);
        // Clean up
        await fetch(`http://127.0.0.1:${port}/callback?key=mnk_test&state=${state}`);
        await keyPromise;
        close();
    });
});
// =============================================================
// resolveConfig integration with stored config (AC-4)
// =============================================================
(0, vitest_1.describe)("resolveConfig with stored login", () => {
    let tmpDir;
    let origHome;
    let origExit;
    let origApiKey;
    let origUrl;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
        origHome = process.env.HOME;
        process.env.HOME = tmpDir;
        origApiKey = process.env.MNOTES_API_KEY;
        origUrl = process.env.MNOTES_URL;
        delete process.env.MNOTES_API_KEY;
        delete process.env.MNOTES_URL;
        origExit = process.exit;
        process.exit = ((code) => {
            throw new Error(`process.exit(${code})`);
        });
    });
    (0, vitest_1.afterEach)(() => {
        process.env.HOME = origHome;
        if (origApiKey !== undefined)
            process.env.MNOTES_API_KEY = origApiKey;
        else
            delete process.env.MNOTES_API_KEY;
        if (origUrl !== undefined)
            process.env.MNOTES_URL = origUrl;
        else
            delete process.env.MNOTES_URL;
        process.exit = origExit;
        cleanTmpDir(tmpDir);
    });
    (0, vitest_1.it)("uses stored config when no CLI flag or env var is set", () => {
        (0, login_1.writeConfig)({
            apiKey: "mnk_storedkey123",
            serverUrl: "https://stored.example.com",
        });
        const config = (0, config_1.resolveConfig)({});
        (0, vitest_1.expect)(config.apiKey).toBe("mnk_storedkey123");
        (0, vitest_1.expect)(config.baseUrl).toBe("https://stored.example.com");
    });
    (0, vitest_1.it)("CLI flag overrides stored config", () => {
        (0, login_1.writeConfig)({
            apiKey: "mnk_storedkey123",
            serverUrl: "https://stored.example.com",
        });
        const config = (0, config_1.resolveConfig)({
            apiKey: "mnk_clikey456",
            url: "http://cli-override.com",
        });
        (0, vitest_1.expect)(config.apiKey).toBe("mnk_clikey456");
        (0, vitest_1.expect)(config.baseUrl).toBe("http://cli-override.com");
    });
    (0, vitest_1.it)("env var overrides stored config", () => {
        (0, login_1.writeConfig)({
            apiKey: "mnk_storedkey123",
            serverUrl: "https://stored.example.com",
        });
        process.env.MNOTES_API_KEY = "mnk_envkey789";
        process.env.MNOTES_URL = "http://env-override.com";
        const config = (0, config_1.resolveConfig)({});
        (0, vitest_1.expect)(config.apiKey).toBe("mnk_envkey789");
        (0, vitest_1.expect)(config.baseUrl).toBe("http://env-override.com");
    });
    (0, vitest_1.it)("exits with error when no config source is available", () => {
        (0, vitest_1.expect)(() => (0, config_1.resolveConfig)({})).toThrow("process.exit(1)");
    });
});
// =============================================================
// isSSHSession — SSH environment detection
// =============================================================
(0, vitest_1.describe)("isSSHSession", () => {
    let saved;
    (0, vitest_1.beforeEach)(() => {
        saved = {
            SSH_CLIENT: process.env.SSH_CLIENT,
            SSH_TTY: process.env.SSH_TTY,
            SSH_CONNECTION: process.env.SSH_CONNECTION,
        };
        delete process.env.SSH_CLIENT;
        delete process.env.SSH_TTY;
        delete process.env.SSH_CONNECTION;
    });
    (0, vitest_1.afterEach)(() => {
        for (const [k, v] of Object.entries(saved)) {
            if (v === undefined)
                delete process.env[k];
            else
                process.env[k] = v;
        }
    });
    (0, vitest_1.it)("returns false when no SSH env vars are set", () => {
        (0, vitest_1.expect)((0, login_1.isSSHSession)()).toBe(false);
    });
    (0, vitest_1.it)("returns true when SSH_CLIENT is set", () => {
        process.env.SSH_CLIENT = "1.2.3.4 12345 22";
        (0, vitest_1.expect)((0, login_1.isSSHSession)()).toBe(true);
    });
    (0, vitest_1.it)("returns true when SSH_TTY is set", () => {
        process.env.SSH_TTY = "/dev/pts/0";
        (0, vitest_1.expect)((0, login_1.isSSHSession)()).toBe(true);
    });
    (0, vitest_1.it)("returns true when SSH_CONNECTION is set", () => {
        process.env.SSH_CONNECTION = "1.2.3.4 12345 5.6.7.8 22";
        (0, vitest_1.expect)((0, login_1.isSSHSession)()).toBe(true);
    });
});
// =============================================================
// deviceLogin — device code polling flow
// =============================================================
(0, vitest_1.describe)("deviceLogin", () => {
    let origFetch;
    (0, vitest_1.beforeEach)(() => {
        origFetch = global.fetch;
    });
    (0, vitest_1.afterEach)(() => {
        global.fetch = origFetch;
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)("returns API key when server approves on first poll", async () => {
        const expectedKey = "mnk_devicetestkey1234567890abcdef";
        let callCount = 0;
        global.fetch = vitest_1.vi.fn().mockImplementation((url) => {
            callCount++;
            if (String(url).includes("/api/auth/device") && !String(url).includes("poll")) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, expiresAt: new Date().toISOString() }) });
            }
            // Poll endpoint — approve immediately
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ status: "approved", apiKey: expectedKey }),
            });
        });
        const origWrite = process.stderr.write;
        process.stderr.write = () => true;
        try {
            const key = await (0, login_1.deviceLogin)("https://example.com");
            (0, vitest_1.expect)(key).toBe(expectedKey);
            (0, vitest_1.expect)(callCount).toBeGreaterThanOrEqual(2); // register + at least one poll
        }
        finally {
            process.stderr.write = origWrite;
        }
    });
    (0, vitest_1.it)("throws when server returns expired status", async () => {
        global.fetch = vitest_1.vi.fn().mockImplementation((url) => {
            if (String(url).includes("/api/auth/device") && !String(url).includes("poll")) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
            }
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ status: "expired" }),
            });
        });
        const origWrite = process.stderr.write;
        process.stderr.write = () => true;
        try {
            await (0, vitest_1.expect)((0, login_1.deviceLogin)("https://example.com")).rejects.toThrow("expired");
        }
        finally {
            process.stderr.write = origWrite;
        }
    });
    (0, vitest_1.it)("throws when registration request fails", async () => {
        global.fetch = vitest_1.vi.fn().mockResolvedValue({
            ok: false,
            statusText: "Internal Server Error",
            json: () => Promise.resolve({ error: "server error" }),
        });
        const origWrite = process.stderr.write;
        process.stderr.write = () => true;
        try {
            await (0, vitest_1.expect)((0, login_1.deviceLogin)("https://example.com")).rejects.toThrow("Failed to start device auth");
        }
        finally {
            process.stderr.write = origWrite;
        }
    });
    (0, vitest_1.it)("throws 'Not found' when poll returns 404", async () => {
        global.fetch = vitest_1.vi.fn().mockImplementation((url) => {
            if (String(url).includes("/api/auth/device") && !String(url).includes("poll")) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
            }
            return Promise.resolve({ ok: true, status: 404, json: () => Promise.resolve({}) });
        });
        const origWrite = process.stderr.write;
        process.stderr.write = () => true;
        try {
            await (0, vitest_1.expect)((0, login_1.deviceLogin)("https://example.com")).rejects.toThrow("not found");
        }
        finally {
            process.stderr.write = origWrite;
        }
    });
});
