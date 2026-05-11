import { describe, it, expect, vi, beforeEach } from "vitest";
import { logAppendAction } from "../wiki/log-append";
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
    wikiLogAppend: vi.fn(),
  })),
}));

import * as clientModule from "../../client";

// ── helpers ───────────────────────────────────────────────────────────────────

const ctx: ActionContext = { json: false, globalOpts: {} };

function mockAppend(result: { appended: string }) {
  const client = { wikiLogAppend: vi.fn().mockResolvedValue(result) };
  vi.mocked(clientModule.createClient).mockReturnValue(client as never);
  return client;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("logAppendAction (mcpTool: wiki_log_append)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("happy path — forwards kind, ref, and summary to the client", async () => {
    const result = { appended: "2026-05-08T10:00:00Z [ingest] ref=my-doc summary=done" };
    const client = mockAppend(result);

    await logAppendAction.run(
      { kind: "ingest", ref: "my-doc", summary: "done" },
      ctx,
    );

    expect(client.wikiLogAppend).toHaveBeenCalledOnce();
    expect(client.wikiLogAppend).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      kind: "ingest",
      ref: "my-doc",
      summary: "done",
    });
  });

  it("happy path — summary is optional and omitted when absent", async () => {
    const result = { appended: "2026-05-08T10:00:00Z [lint] ref=run-42" };
    const client = mockAppend(result);

    await logAppendAction.run({ kind: "lint", ref: "run-42" }, ctx);

    expect(client.wikiLogAppend).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      kind: "lint",
      ref: "run-42",
      summary: undefined,
    });
  });

  it("returns the appended string from the client", async () => {
    const result = { appended: "some log line" };
    mockAppend(result);

    const out = await logAppendAction.run({ kind: "decision", ref: "arch-001" }, ctx);

    expect(out).toEqual(result);
  });

  it("renderHuman prints result.appended", () => {
    const writes: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });

    logAppendAction.renderHuman!({ appended: "2026-05-08 [query] ref=search-1" });

    expect(writes.join("")).toBe("2026-05-08 [query] ref=search-1\n");
  });

  it("exits non-zero and writes error for unknown kind", async () => {
    const stderrWrites: string[] = [];
    vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      stderrWrites.push(String(chunk));
      return true;
    });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    await expect(
      logAppendAction.run({ kind: "invalid-kind", ref: "x" }, ctx),
    ).rejects.toThrow("process.exit called");

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(stderrWrites.join("")).toContain("Invalid kind 'invalid-kind'");
    expect(stderrWrites.join("")).toContain("ingest, query, lint, decision");
  });

  it("all four valid kinds pass validation", async () => {
    const kinds = ["ingest", "query", "lint", "decision"] as const;
    for (const kind of kinds) {
      const client = mockAppend({ appended: `line for ${kind}` });
      await logAppendAction.run({ kind, ref: "r" }, ctx);
      expect(client.wikiLogAppend).toHaveBeenCalledWith(
        expect.objectContaining({ kind }),
      );
      vi.clearAllMocks();
    }
  });

  it("throws when workspaceId is missing", async () => {
    const { resolveConfig } = await import("../../config");
    vi.mocked(resolveConfig).mockReturnValueOnce({
      apiKey: "test-key",
      baseUrl: "https://mnotes.example.com",
      workspaceId: undefined,
    } as never);

    await expect(
      logAppendAction.run({ kind: "lint", ref: "r" }, ctx),
    ).rejects.toThrow("No workspace configured");
  });
});
