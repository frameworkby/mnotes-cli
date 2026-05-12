import { describe, it, expect, vi, beforeEach } from "vitest";
import { statsAction } from "../kb/stats";
import type { ActionContext } from "../_register-group";
import type { KbStats } from "../../client";

// ── shared mocks ──────────────────────────────────────────────────────────────

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: "ws-1",
  })),
}));

const mockGetKbStats = vi.fn();

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({
    getKbStats: mockGetKbStats,
  })),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const ctxHuman: ActionContext = { json: false, globalOpts: {} };
const ctxJson: ActionContext = { json: true, globalOpts: {} };

function makeStats(overrides: Partial<KbStats> = {}): KbStats {
  return {
    totalNotes: 42,
    totalTags: 7,
    orphanCount: 3,
    staleCount: 5,
    conflictCount: 1,
    embeddingCoverage: 87.5,
    missingEmbeddingKeys: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── statsAction.run ───────────────────────────────────────────────────────────

describe("statsAction.run", () => {
  it("returns server payload unchanged regardless of --show-missing flag", async () => {
    const server = makeStats({ missingEmbeddingKeys: ["k1", "k2"] });
    mockGetKbStats.mockResolvedValue(server);

    // No flag
    const withoutFlag = await statsAction.run({}, ctxHuman);
    expect(withoutFlag).toEqual(server);
    expect(Object.keys(withoutFlag)).not.toContain("_showMissing");

    // With flag — payload still pristine (no CLI-only fields leak)
    mockGetKbStats.mockResolvedValue(server);
    const withFlag = await statsAction.run({ showMissing: true }, ctxJson);
    expect(withFlag).toEqual(server);
    expect(Object.keys(withFlag)).not.toContain("_showMissing");
  });

  it("payload always includes missingEmbeddingKeys", async () => {
    const keys = ["alpha", "beta"];
    mockGetKbStats.mockResolvedValue(makeStats({ missingEmbeddingKeys: keys }));

    const result = await statsAction.run({}, ctxHuman);
    expect(result.missingEmbeddingKeys).toEqual(keys);
  });
});

// ── renderHuman ───────────────────────────────────────────────────────────────

describe("statsAction.renderHuman", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  it("prints summary line with all fields", () => {
    statsAction.renderHuman!(makeStats(), {});

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const line = consoleSpy.mock.calls[0][0] as string;
    expect(line).toContain("42 notes");
    expect(line).toContain("7 tags");
    expect(line).toContain("3 orphans");
    expect(line).toContain("5 stale");
    expect(line).toContain("1 conflicts");
    expect(line).toContain("87.5%");
    expect(line).toContain("0 missing");
  });

  it("does NOT print missing section when input.showMissing is false", () => {
    const stats = makeStats({ missingEmbeddingKeys: ["key/a", "key/b"] });

    statsAction.renderHuman!(stats, { showMissing: false });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).not.toContain("Missing embeddings");
  });

  it("does NOT print missing section when input.showMissing is undefined", () => {
    const stats = makeStats({ missingEmbeddingKeys: ["key/a"] });

    statsAction.renderHuman!(stats, {});

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).not.toContain("Missing embeddings");
  });

  it("does NOT print missing section when list is empty even with --show-missing", () => {
    statsAction.renderHuman!(makeStats({ missingEmbeddingKeys: [] }), {
      showMissing: true,
    });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).not.toContain("Missing embeddings");
  });

  it("prints keys one per line when input.showMissing=true and list non-empty", () => {
    const keys = ["alpha/x", "beta/y"];

    statsAction.renderHuman!(makeStats({ missingEmbeddingKeys: keys }), {
      showMissing: true,
    });

    const allLines = consoleSpy.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(allLines).toContain("Missing embeddings:");
    expect(allLines.some((l: string) => l.includes("alpha/x"))).toBe(true);
    expect(allLines.some((l: string) => l.includes("beta/y"))).toBe(true);
  });

  it("summary line reflects count of missing keys", () => {
    statsAction.renderHuman!(
      makeStats({ missingEmbeddingKeys: ["k1", "k2", "k3"] }),
      {},
    );

    const line = consoleSpy.mock.calls[0][0] as string;
    expect(line).toContain("3 missing");
  });
});
