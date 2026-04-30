import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as http from "http";
import {
  registerLoginCommand,
  readConfig,
  writeConfig,
  maskKey,
  configPath,
  startLocalServer,
  isSSHSession,
  deviceLogin,
} from "../login";
import { resolveConfig } from "../../config";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "mnotes-login-test-"));
}

function cleanTmpDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

// =============================================================
// maskKey utility
// =============================================================
describe("maskKey", () => {
  it("masks a full API key showing prefix and last 4 chars", () => {
    const key = "mnk_abcdef1234567890abcdef1234567890abcdef12345678";
    const masked = maskKey(key);
    expect(masked).toBe("mnk_abcd...5678");
    expect(masked).not.toContain("1234567890");
  });

  it("returns short keys as-is", () => {
    expect(maskKey("mnk_abc")).toBe("mnk_abc");
  });
});

// =============================================================
// readConfig / writeConfig
// =============================================================
describe("config file operations", () => {
  let tmpDir: string;
  let origHome: string | undefined;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    origHome = process.env.HOME;
    process.env.HOME = tmpDir;
  });

  afterEach(() => {
    process.env.HOME = origHome;
    cleanTmpDir(tmpDir);
  });

  it("configPath resolves under HOME", () => {
    const p = configPath();
    expect(p).toBe(path.join(tmpDir, ".mnotes", "config.json"));
  });

  it("readConfig returns null when no config file exists", () => {
    expect(readConfig()).toBeNull();
  });

  it("writeConfig creates config file and readConfig reads it back", () => {
    writeConfig({ apiKey: "mnk_testkey123", serverUrl: "http://localhost:3000" });

    const config = readConfig();
    expect(config).not.toBeNull();
    expect(config!.apiKey).toBe("mnk_testkey123");
    expect(config!.serverUrl).toBe("http://localhost:3000");
  });

  it("writeConfig creates .mnotes directory if missing", () => {
    const mnotesDir = path.join(tmpDir, ".mnotes");
    expect(fs.existsSync(mnotesDir)).toBe(false);

    writeConfig({ apiKey: "mnk_test", serverUrl: "http://localhost:3000" });
    expect(fs.existsSync(mnotesDir)).toBe(true);
  });

  it("writeConfig sets restrictive file permissions (0o600)", () => {
    writeConfig({ apiKey: "mnk_test", serverUrl: "http://localhost:3000" });

    const p = configPath();
    const stats = fs.statSync(p);
    const mode = stats.mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it("readConfig returns null for invalid JSON", () => {
    const mnotesDir = path.join(tmpDir, ".mnotes");
    fs.mkdirSync(mnotesDir, { recursive: true });
    fs.writeFileSync(path.join(mnotesDir, "config.json"), "not json{", "utf-8");
    expect(readConfig()).toBeNull();
  });

  it("readConfig returns null for config missing required fields", () => {
    const mnotesDir = path.join(tmpDir, ".mnotes");
    fs.mkdirSync(mnotesDir, { recursive: true });
    fs.writeFileSync(
      path.join(mnotesDir, "config.json"),
      JSON.stringify({ apiKey: "mnk_test" }),
      "utf-8",
    );
    expect(readConfig()).toBeNull();
  });
});

// =============================================================
// mnotes login --status (AC-7)
// =============================================================
describe("mnotes login --status", () => {
  let tmpDir: string;
  let origHome: string | undefined;
  let origExit: typeof process.exit;
  let exitCode: number | undefined;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    origHome = process.env.HOME;
    process.env.HOME = tmpDir;
    exitCode = undefined;
    origExit = process.exit;
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error(`process.exit(${code})`);
    }) as never;
  });

  afterEach(() => {
    process.env.HOME = origHome;
    process.exit = origExit;
    cleanTmpDir(tmpDir);
    vi.restoreAllMocks();
  });

  it("reports not logged in when no config exists", async () => {
    const program = new Command();
    program.exitOverride();
    registerLoginCommand(program);

    let stderrOutput = "";
    const origWrite = process.stderr.write;
    process.stderr.write = (chunk: string | Uint8Array) => {
      stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
      return true;
    };

    try {
      await program.parseAsync(["node", "mnotes", "login", "--status"]);
    } catch {
      // Expected — process.exit throws
    } finally {
      process.stderr.write = origWrite;
    }

    expect(exitCode).toBe(1);
    expect(stderrOutput).toContain("Not logged in");
  });

  it("shows stored config and validates key when logged in", async () => {
    writeConfig({
      apiKey: "mnk_abcdef1234567890abcdef1234567890abcdef12345678",
      serverUrl: "http://localhost:3000",
    });

    const program = new Command();
    program.exitOverride();
    registerLoginCommand(program);

    let stderrOutput = "";
    const origWrite = process.stderr.write;
    process.stderr.write = (chunk: string | Uint8Array) => {
      stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
      return true;
    };

    const origFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    try {
      await program.parseAsync(["node", "mnotes", "login", "--status"]);
    } catch {
      // may exit
    } finally {
      process.stderr.write = origWrite;
      global.fetch = origFetch;
    }

    expect(stderrOutput).toContain("http://localhost:3000");
    expect(stderrOutput).toContain("mnk_abcd...5678");
    expect(stderrOutput).toContain("active");
  });

  it("reports invalid when server rejects the key", async () => {
    writeConfig({
      apiKey: "mnk_abcdef1234567890abcdef1234567890abcdef12345678",
      serverUrl: "http://localhost:3000",
    });

    const program = new Command();
    program.exitOverride();
    registerLoginCommand(program);

    let stderrOutput = "";
    const origWrite = process.stderr.write;
    process.stderr.write = (chunk: string | Uint8Array) => {
      stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
      return true;
    };

    const origFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });

    try {
      await program.parseAsync(["node", "mnotes", "login", "--status"]);
    } catch {
      // expected
    } finally {
      process.stderr.write = origWrite;
      global.fetch = origFetch;
    }

    expect(exitCode).toBe(1);
    expect(stderrOutput).toContain("invalid");
  });
});

// =============================================================
// mnotes login --api-key (AC-6: manual fallback)
// =============================================================
describe("mnotes login --api-key", () => {
  let tmpDir: string;
  let origHome: string | undefined;
  let origExit: typeof process.exit;
  let exitCode: number | undefined;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    origHome = process.env.HOME;
    process.env.HOME = tmpDir;
    exitCode = undefined;
    origExit = process.exit;
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error(`process.exit(${code})`);
    }) as never;
  });

  afterEach(() => {
    process.env.HOME = origHome;
    process.exit = origExit;
    cleanTmpDir(tmpDir);
    vi.restoreAllMocks();
  });

  it("rejects keys without mnk_ prefix", async () => {
    const program = new Command();
    program.exitOverride();
    registerLoginCommand(program);

    let stderrOutput = "";
    const origWrite = process.stderr.write;
    process.stderr.write = (chunk: string | Uint8Array) => {
      stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
      return true;
    };

    try {
      await program.parseAsync(["node", "mnotes", "login", "--api-key", "bad_key"]);
    } catch {
      // Expected
    } finally {
      process.stderr.write = origWrite;
    }

    expect(exitCode).toBe(1);
    expect(stderrOutput).toContain("must start with 'mnk_'");
  });

  it("saves valid key to config after successful validation", async () => {
    const program = new Command();
    program.exitOverride();
    registerLoginCommand(program);

    let stderrOutput = "";
    const origWrite = process.stderr.write;
    process.stderr.write = (chunk: string | Uint8Array) => {
      stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
      return true;
    };

    const origFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    try {
      await program.parseAsync([
        "node", "mnotes", "login",
        "--api-key", "mnk_validkey1234567890abcdef",
        "--url", "https://notes.example.com",
      ]);
    } finally {
      process.stderr.write = origWrite;
      global.fetch = origFetch;
    }

    expect(stderrOutput).toContain("Logged in successfully");
    expect(stderrOutput).toContain("https://notes.example.com");

    const config = readConfig();
    expect(config).not.toBeNull();
    expect(config!.apiKey).toBe("mnk_validkey1234567890abcdef");
    expect(config!.serverUrl).toBe("https://notes.example.com");
  });

  it("fails when server validation returns error", async () => {
    const program = new Command();
    program.exitOverride();
    registerLoginCommand(program);

    let stderrOutput = "";
    const origWrite = process.stderr.write;
    process.stderr.write = (chunk: string | Uint8Array) => {
      stderrOutput += typeof chunk === "string" ? chunk : chunk.toString();
      return true;
    };

    const origFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });

    try {
      await program.parseAsync(["node", "mnotes", "login", "--api-key", "mnk_bad123"]);
    } catch {
      // Expected
    } finally {
      process.stderr.write = origWrite;
      global.fetch = origFetch;
    }

    expect(exitCode).toBe(1);
    expect(stderrOutput).toContain("Key validation failed");
  });
});

// =============================================================
// Local callback server (AC-2, AC-3)
// =============================================================
describe("startLocalServer", () => {
  it("starts on a random port and resolves key on valid callback", async () => {
    const state = "a".repeat(64);
    const { port, keyPromise, close } = await startLocalServer(state);

    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThanOrEqual(65535);

    // Simulate the web app redirecting back
    const testKey = "mnk_callbacktestkey1234567890";
    const res = await fetch(
      `http://127.0.0.1:${port}/callback?key=${testKey}&state=${state}`,
    );
    expect(res.status).toBe(200);

    const key = await keyPromise;
    expect(key).toBe(testKey);
    close();
  });

  it("returns 403 for mismatched state (CSRF protection)", async () => {
    const state = "b".repeat(64);
    const { port, keyPromise, close } = await startLocalServer(state);

    const res = await fetch(
      `http://127.0.0.1:${port}/callback?key=mnk_test&state=wrongstate`,
    );
    expect(res.status).toBe(403);

    // Send valid callback to clean up
    await fetch(`http://127.0.0.1:${port}/callback?key=mnk_test&state=${state}`);
    await keyPromise;
    close();
  });

  it("returns 400 for missing parameters", async () => {
    const state = "c".repeat(64);
    const { port, keyPromise, close } = await startLocalServer(state);

    const res = await fetch(`http://127.0.0.1:${port}/callback`);
    expect(res.status).toBe(400);

    // Clean up
    await fetch(`http://127.0.0.1:${port}/callback?key=mnk_test&state=${state}`);
    await keyPromise;
    close();
  });

  it("returns 404 for non-callback paths", async () => {
    const state = "d".repeat(64);
    const { port, keyPromise, close } = await startLocalServer(state);

    const res = await fetch(`http://127.0.0.1:${port}/other`);
    expect(res.status).toBe(404);

    // Clean up
    await fetch(`http://127.0.0.1:${port}/callback?key=mnk_test&state=${state}`);
    await keyPromise;
    close();
  });
});

// =============================================================
// resolveConfig integration with stored config (AC-4)
// =============================================================
describe("resolveConfig with stored login", () => {
  let tmpDir: string;
  let origHome: string | undefined;
  let origExit: typeof process.exit;
  let origApiKey: string | undefined;
  let origUrl: string | undefined;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    origHome = process.env.HOME;
    process.env.HOME = tmpDir;
    origApiKey = process.env.MNOTES_API_KEY;
    origUrl = process.env.MNOTES_URL;
    delete process.env.MNOTES_API_KEY;
    delete process.env.MNOTES_URL;
    origExit = process.exit;
    process.exit = ((code?: number) => {
      throw new Error(`process.exit(${code})`);
    }) as never;
  });

  afterEach(() => {
    process.env.HOME = origHome;
    if (origApiKey !== undefined) process.env.MNOTES_API_KEY = origApiKey;
    else delete process.env.MNOTES_API_KEY;
    if (origUrl !== undefined) process.env.MNOTES_URL = origUrl;
    else delete process.env.MNOTES_URL;
    process.exit = origExit;
    cleanTmpDir(tmpDir);
  });

  it("uses stored config when no CLI flag or env var is set", () => {
    writeConfig({
      apiKey: "mnk_storedkey123",
      serverUrl: "https://stored.example.com",
    });

    const config = resolveConfig({});
    expect(config.apiKey).toBe("mnk_storedkey123");
    expect(config.baseUrl).toBe("https://stored.example.com");
  });

  it("CLI flag overrides stored config", () => {
    writeConfig({
      apiKey: "mnk_storedkey123",
      serverUrl: "https://stored.example.com",
    });

    const config = resolveConfig({
      apiKey: "mnk_clikey456",
      url: "http://cli-override.com",
    });

    expect(config.apiKey).toBe("mnk_clikey456");
    expect(config.baseUrl).toBe("http://cli-override.com");
  });

  it("env var overrides stored config", () => {
    writeConfig({
      apiKey: "mnk_storedkey123",
      serverUrl: "https://stored.example.com",
    });

    process.env.MNOTES_API_KEY = "mnk_envkey789";
    process.env.MNOTES_URL = "http://env-override.com";

    const config = resolveConfig({});
    expect(config.apiKey).toBe("mnk_envkey789");
    expect(config.baseUrl).toBe("http://env-override.com");
  });

  it("exits with error when no config source is available", () => {
    expect(() => resolveConfig({})).toThrow("process.exit(1)");
  });
});

// =============================================================
// isSSHSession — SSH environment detection
// =============================================================
describe("isSSHSession", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {
      SSH_CLIENT: process.env.SSH_CLIENT,
      SSH_TTY: process.env.SSH_TTY,
      SSH_CONNECTION: process.env.SSH_CONNECTION,
    };
    delete process.env.SSH_CLIENT;
    delete process.env.SSH_TTY;
    delete process.env.SSH_CONNECTION;
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("returns false when no SSH env vars are set", () => {
    expect(isSSHSession()).toBe(false);
  });

  it("returns true when SSH_CLIENT is set", () => {
    process.env.SSH_CLIENT = "1.2.3.4 12345 22";
    expect(isSSHSession()).toBe(true);
  });

  it("returns true when SSH_TTY is set", () => {
    process.env.SSH_TTY = "/dev/pts/0";
    expect(isSSHSession()).toBe(true);
  });

  it("returns true when SSH_CONNECTION is set", () => {
    process.env.SSH_CONNECTION = "1.2.3.4 12345 5.6.7.8 22";
    expect(isSSHSession()).toBe(true);
  });
});

// =============================================================
// deviceLogin — device code polling flow
// =============================================================
describe("deviceLogin", () => {
  let origFetch: typeof global.fetch;

  beforeEach(() => {
    origFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it("returns API key when server approves on first poll", async () => {
    const expectedKey = "mnk_devicetestkey1234567890abcdef";
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation((url: string) => {
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
      const key = await deviceLogin("https://example.com");
      expect(key).toBe(expectedKey);
      expect(callCount).toBeGreaterThanOrEqual(2); // register + at least one poll
    } finally {
      process.stderr.write = origWrite;
    }
  });

  it("throws when server returns expired status", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
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
      await expect(deviceLogin("https://example.com")).rejects.toThrow("expired");
    } finally {
      process.stderr.write = origWrite;
    }
  });

  it("throws when registration request fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({ error: "server error" }),
    });

    const origWrite = process.stderr.write;
    process.stderr.write = () => true;

    try {
      await expect(deviceLogin("https://example.com")).rejects.toThrow(
        "Failed to start device auth",
      );
    } finally {
      process.stderr.write = origWrite;
    }
  });

  it("throws 'Not found' when poll returns 404", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("/api/auth/device") && !String(url).includes("poll")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
      }
      return Promise.resolve({ ok: true, status: 404, json: () => Promise.resolve({}) });
    });

    const origWrite = process.stderr.write;
    process.stderr.write = () => true;

    try {
      await expect(deviceLogin("https://example.com")).rejects.toThrow("not found");
    } finally {
      process.stderr.write = origWrite;
    }
  });
});
