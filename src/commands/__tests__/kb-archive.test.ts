import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { archiveAction } from "../kb/archive";
import type { ActionContext } from "../_register-group";

// ── shared mocks ──────────────────────────────────────────────────────────────

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: "ws-1",
  })),
}));

const archiveStaleMemoriesMock = vi.fn();

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({
    archiveStaleMemories: archiveStaleMemoriesMock,
  })),
}));

const ctx: ActionContext = { json: false, globalOpts: {} };

function makeResult(
  overrides: Partial<{ archivedCount: number; entries: unknown[]; missing: string[] }> = {},
) {
  return {
    archivedCount: 1,
    entries: [{ noteId: "n-1", title: "foo", decayScore: 0.5, importance: null }],
    missing: [],
    ...overrides,
  };
}

// ── helpers ───────────────────────────────────────────────────────────────────

let stderrSpy: ReturnType<typeof vi.spyOn>;
let originalExitCode: number | undefined;

beforeEach(() => {
  archiveStaleMemoriesMock.mockReset();
  stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  originalExitCode = process.exitCode as number | undefined;
  process.exitCode = undefined;
});

afterEach(() => {
  stderrSpy.mockRestore();
  process.exitCode = originalExitCode;
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("archiveAction — key-mode", () => {
  it("--key archives a single entry", async () => {
    archiveStaleMemoriesMock.mockResolvedValue(makeResult());

    await archiveAction.run({ key: "foo" }, ctx);

    expect(archiveStaleMemoriesMock).toHaveBeenCalledOnce();
    expect(archiveStaleMemoriesMock).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      keys: ["foo"],
      dryRun: undefined,
    });
  });

  it("--keys csv archives multiple entries", async () => {
    archiveStaleMemoriesMock.mockResolvedValue(
      makeResult({ archivedCount: 3, entries: [], missing: [] }),
    );

    await archiveAction.run({ keys: "foo, bar, baz" }, ctx);

    expect(archiveStaleMemoriesMock).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      keys: ["foo", "bar", "baz"],
      dryRun: undefined,
    });
  });

  it("--key and --keys together are merged and deduplicated", async () => {
    archiveStaleMemoriesMock.mockResolvedValue(makeResult());

    await archiveAction.run({ key: "foo", keys: "foo,bar" }, ctx);

    expect(archiveStaleMemoriesMock).toHaveBeenCalledWith(
      expect.objectContaining({ keys: ["foo", "bar"] }),
    );
  });

  it("--dry-run --key passes dryRun flag and makes no mutation", async () => {
    archiveStaleMemoriesMock.mockResolvedValue(
      makeResult({ archivedCount: 0 }),
    );

    await archiveAction.run({ key: "foo", dryRun: true }, ctx);

    expect(archiveStaleMemoriesMock).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      keys: ["foo"],
      dryRun: true,
    });
  });

  it("missing key is reported to stderr, others succeed, exit code not set", async () => {
    archiveStaleMemoriesMock.mockResolvedValue(
      makeResult({
        archivedCount: 1,
        entries: [{ noteId: "n-1", title: "bar", decayScore: 0.1, importance: null }],
        missing: ["ghost"],
      }),
    );

    await archiveAction.run({ keys: "bar,ghost" }, ctx);

    expect(stderrSpy).toHaveBeenCalledWith("missing: ghost\n");
    expect(process.exitCode).toBeUndefined();
  });

  it("all keys missing sets exit code 1", async () => {
    archiveStaleMemoriesMock.mockResolvedValue(
      makeResult({ archivedCount: 0, entries: [], missing: ["x", "y"] }),
    );

    await archiveAction.run({ keys: "x,y" }, ctx);

    expect(process.exitCode).toBe(1);
    expect(stderrSpy).toHaveBeenCalledWith("missing: x\n");
    expect(stderrSpy).toHaveBeenCalledWith("missing: y\n");
  });
});

describe("archiveAction — validation", () => {
  it("--key + --max-decay-score throws before any client call", async () => {
    await expect(
      archiveAction.run({ key: "foo", maxDecayScore: 0.8 }, ctx),
    ).rejects.toThrow(/cannot be combined/i);

    expect(archiveStaleMemoriesMock).not.toHaveBeenCalled();
  });

  it("--key + --max-importance throws before any client call", async () => {
    await expect(
      archiveAction.run({ key: "foo", maxImportance: 0.3 }, ctx),
    ).rejects.toThrow(/cannot be combined/i);

    expect(archiveStaleMemoriesMock).not.toHaveBeenCalled();
  });

  it("--keys + --max-decay-score throws before any client call", async () => {
    await expect(
      archiveAction.run({ keys: "foo,bar", maxDecayScore: 0.5 }, ctx),
    ).rejects.toThrow(/cannot be combined/i);

    expect(archiveStaleMemoriesMock).not.toHaveBeenCalled();
  });
});

describe("archiveAction — threshold-mode (unchanged)", () => {
  it("no key flags routes to threshold-mode call", async () => {
    archiveStaleMemoriesMock.mockResolvedValue(makeResult());

    await archiveAction.run({ maxDecayScore: 0.7, maxImportance: 0.3 }, ctx);

    expect(archiveStaleMemoriesMock).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      maxDecayScore: 0.7,
      maxImportance: 0.3,
      dryRun: undefined,
    });
  });
});
