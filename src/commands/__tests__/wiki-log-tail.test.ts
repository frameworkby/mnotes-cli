import { describe, it, expect, vi, beforeEach } from "vitest";
import { logTailAction } from "../wiki/log-tail";
import type { ActionContext } from "../_register-group";

// ── shared mocks ──────────────────────────────────────────────────────────────

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: "ws-1",
  })),
}));

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({
    wikiLogTail: vi.fn(),
  })),
}));

import * as clientModule from "../../client";

// ── helpers ───────────────────────────────────────────────────────────────────

const ctx: ActionContext = { json: false, globalOpts: {} };

function makeEntry(raw: string, parsed = true) {
  return { raw, parsed, timestamp: "2026-05-08T10:00:00Z", kind: "ingest", ref: "r" };
}

function mockTail(entries: ReturnType<typeof makeEntry>[]) {
  const client = { wikiLogTail: vi.fn().mockResolvedValue({ entries }) };
  vi.mocked(clientModule.createClient).mockReturnValue(client as never);
  return client;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("logTailAction (mcpTool: wiki_log_tail)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("happy path — calls wikiLogTail with workspaceId and no limit by default", async () => {
    const client = mockTail([makeEntry("line 1")]);

    await logTailAction.run({}, ctx);

    expect(client.wikiLogTail).toHaveBeenCalledOnce();
    expect(client.wikiLogTail).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      limit: undefined,
    });
  });

  it("forwards numeric limit when provided", async () => {
    const client = mockTail([makeEntry("line 1")]);

    await logTailAction.run({ limit: "10" }, ctx);

    expect(client.wikiLogTail).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      limit: 10,
    });
  });

  it("returns entries from the client", async () => {
    const entries = [makeEntry("a"), makeEntry("b")];
    mockTail(entries);

    const out = await logTailAction.run({}, ctx);

    expect(out).toEqual({ entries });
  });

  it("renderHuman prints each entry raw separated by blank lines", () => {
    const entries = [
      makeEntry("entry one\n"),
      makeEntry("entry two\n"),
      makeEntry("entry three\n"),
    ];
    const writes: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });

    logTailAction.renderHuman!({ entries });

    const output = writes.join("");
    expect(output).toContain("entry one");
    expect(output).toContain("entry two");
    expect(output).toContain("entry three");
    // blank line separators between entries
    expect(output).toContain("entry one\n\nentry two");
  });

  it("renderHuman prints (no entries) when list is empty", () => {
    const writes: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });

    logTailAction.renderHuman!({ entries: [] });

    expect(writes.join("")).toBe("(no entries)\n");
  });

  it("renderHuman adds trailing newline when raw lacks one", () => {
    const writes: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });

    logTailAction.renderHuman!({ entries: [makeEntry("no-newline")] });

    expect(writes.join("")).toContain("no-newline\n");
  });

  it("exits non-zero for limit below 1", async () => {
    const stderrWrites: string[] = [];
    vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      stderrWrites.push(String(chunk));
      return true;
    });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    await expect(logTailAction.run({ limit: "0" }, ctx)).rejects.toThrow(
      "process.exit called",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(stderrWrites.join("")).toContain("--limit must be an integer between 1 and 200");
  });

  it("exits non-zero for limit above 200", async () => {
    const stderrWrites: string[] = [];
    vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      stderrWrites.push(String(chunk));
      return true;
    });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    await expect(logTailAction.run({ limit: "201" }, ctx)).rejects.toThrow(
      "process.exit called",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits non-zero for non-integer limit", async () => {
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    await expect(logTailAction.run({ limit: "3.5" }, ctx)).rejects.toThrow(
      "process.exit called",
    );
  });

  it("accepts boundary limit of 1", async () => {
    const client = mockTail([makeEntry("only")]);

    await logTailAction.run({ limit: "1" }, ctx);

    expect(client.wikiLogTail).toHaveBeenCalledWith({ workspaceId: "ws-1", limit: 1 });
  });

  it("accepts boundary limit of 200", async () => {
    const client = mockTail([]);

    await logTailAction.run({ limit: "200" }, ctx);

    expect(client.wikiLogTail).toHaveBeenCalledWith({ workspaceId: "ws-1", limit: 200 });
  });

  it("throws when workspaceId is missing", async () => {
    const { resolveConfig } = await import("../../config");
    vi.mocked(resolveConfig).mockReturnValueOnce({
      apiKey: "test-key",
      baseUrl: "https://mnotes.example.com",
      workspaceId: undefined,
    } as never);

    await expect(logTailAction.run({}, ctx)).rejects.toThrow("No workspace configured");
  });
});
