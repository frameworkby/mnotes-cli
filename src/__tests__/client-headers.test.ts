import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient, setCliSession, toAsciiHeader } from "../client";

describe("toAsciiHeader", () => {
  it("passes ASCII through unchanged", () => {
    expect(toAsciiHeader("wiki log tail --limit 10")).toBe("wiki log tail --limit 10");
  });

  it("replaces em-dash and other non-ASCII with '?'", () => {
    expect(toAsciiHeader("ask what — really?")).toBe("ask what ? really?");
    expect(toAsciiHeader("emoji 🚀 here")).toBe("emoji ?? here");
  });

  it("strips control chars (newline, etc.)", () => {
    expect(toAsciiHeader("a\nb\rc")).toBe("a?b?c");
  });
});

describe("createClient header sanitization", () => {
  const originalFetch = globalThis.fetch;
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.fetch = originalFetch;
  });

  it("does not throw when sessionLabel contains non-ASCII chars", async () => {
    setCliSession({ sessionId: "abc", sessionLabel: "ask 'why — though?' 🚀" });
    const client = createClient("http://localhost", "test-key");
    await expect(client.listNotes()).resolves.toBeDefined();

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const init = call[1] as RequestInit;
    const label = (init.headers as Record<string, string>)["X-Mnotes-Session-Label"];
    expect(label).toBe("ask 'why ? though?' ??");
    // Sanity: the value must be Latin-1 only.
    expect(/^[\x20-\x7E\t]*$/.test(label)).toBe(true);
  });
});

describe("createClient board requests", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("deleteBoardTask tolerates a 204 with no body", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = createClient("http://localhost", "test-key");
    await expect(client.deleteBoardTask("t 1")).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0]).toEqual([
      "http://localhost/api/v1/board/tasks/t%201",
      expect.objectContaining({ method: "DELETE" }),
    ]);
  });
});
