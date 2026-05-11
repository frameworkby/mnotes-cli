import { describe, it, expect, vi, beforeEach } from "vitest";
import { indexRefreshAction } from "../wiki/index-refresh";
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
    wikiIndexRefresh: vi.fn(),
  })),
}));

import * as clientModule from "../../client";

// ── helpers ───────────────────────────────────────────────────────────────────

const ctx: ActionContext = { json: false, globalOpts: {} };

function mockRefresh(result: { added: number; removed: number; unchanged: number; total: number }) {
  const client = { wikiIndexRefresh: vi.fn().mockResolvedValue(result) };
  vi.mocked(clientModule.createClient).mockReturnValue(client as never);
  return client;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("indexRefreshAction (mcpTool: wiki_index_refresh)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls wikiIndexRefresh with the configured workspaceId", async () => {
    const result = { added: 3, removed: 1, unchanged: 10, total: 12 };
    const client = mockRefresh(result);

    await indexRefreshAction.run({}, ctx);

    expect(client.wikiIndexRefresh).toHaveBeenCalledOnce();
    expect(client.wikiIndexRefresh).toHaveBeenCalledWith("ws-1");
  });

  it("returns the refresh result", async () => {
    const result = { added: 5, removed: 0, unchanged: 20, total: 25 };
    mockRefresh(result);

    const out = await indexRefreshAction.run({}, ctx);

    expect(out).toEqual(result);
  });

  it("renderHuman prints the expected line", () => {
    const result = { added: 2, removed: 1, unchanged: 7, total: 8 };
    const writes: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });

    indexRefreshAction.renderHuman!(result);

    expect(writes.join("")).toBe(
      "index refresh — added=2 removed=1 unchanged=7 total=8\n",
    );
  });

  it("renderHuman handles zero counts", () => {
    const result = { added: 0, removed: 0, unchanged: 0, total: 0 };
    const writes: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });

    indexRefreshAction.renderHuman!(result);

    expect(writes.join("")).toBe(
      "index refresh — added=0 removed=0 unchanged=0 total=0\n",
    );
  });

  it("throws when workspaceId is missing", async () => {
    const { resolveConfig } = await import("../../config");
    vi.mocked(resolveConfig).mockReturnValueOnce({
      apiKey: "test-key",
      baseUrl: "https://mnotes.example.com",
      workspaceId: undefined,
    } as never);

    await expect(indexRefreshAction.run({}, ctx)).rejects.toThrow(
      "No workspace configured",
    );
  });
});
