"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const client_1 = require("../client");
(0, vitest_1.describe)("toAsciiHeader", () => {
    (0, vitest_1.it)("passes ASCII through unchanged", () => {
        (0, vitest_1.expect)((0, client_1.toAsciiHeader)("wiki log tail --limit 10")).toBe("wiki log tail --limit 10");
    });
    (0, vitest_1.it)("replaces em-dash and other non-ASCII with '?'", () => {
        (0, vitest_1.expect)((0, client_1.toAsciiHeader)("ask what — really?")).toBe("ask what ? really?");
        (0, vitest_1.expect)((0, client_1.toAsciiHeader)("emoji 🚀 here")).toBe("emoji ?? here");
    });
    (0, vitest_1.it)("strips control chars (newline, etc.)", () => {
        (0, vitest_1.expect)((0, client_1.toAsciiHeader)("a\nb\rc")).toBe("a?b?c");
    });
});
(0, vitest_1.describe)("createClient header sanitization", () => {
    const originalFetch = globalThis.fetch;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.stubGlobal("fetch", vitest_1.vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
        })));
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.unstubAllGlobals();
        globalThis.fetch = originalFetch;
    });
    (0, vitest_1.it)("does not throw when sessionLabel contains non-ASCII chars", async () => {
        (0, client_1.setCliSession)({ sessionId: "abc", sessionLabel: "ask 'why — though?' 🚀" });
        const client = (0, client_1.createClient)("http://localhost", "test-key");
        await (0, vitest_1.expect)(client.listNotes()).resolves.toBeDefined();
        const call = globalThis.fetch.mock.calls[0];
        const init = call[1];
        const label = init.headers["X-Mnotes-Session-Label"];
        (0, vitest_1.expect)(label).toBe("ask 'why ? though?' ??");
        // Sanity: the value must be Latin-1 only.
        (0, vitest_1.expect)(/^[\x20-\x7E\t]*$/.test(label)).toBe(true);
    });
});
