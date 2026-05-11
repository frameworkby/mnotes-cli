import { describe, it, expect, vi, beforeEach } from "vitest";
import { lintAction, filterOrphans, SYSTEM_NOTE_TITLES } from "../wiki/lint";
import type { ActionContext } from "../_register-group";
import type { WikiLintResult, WikiLintOrphan } from "../../client";

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
    wikiLint: vi.fn(),
  })),
}));

import * as clientModule from "../../client";

// ── helpers ───────────────────────────────────────────────────────────────────

const ctx: ActionContext = { json: false, globalOpts: {} };

function makeOrphan(
  title: string,
  id: string,
  archived = false,
): WikiLintOrphan {
  return { id, title, updatedAt: "2026-05-01T00:00:00Z", archived };
}

function makeResult(orphans: WikiLintOrphan[]): WikiLintResult {
  return {
    orphans,
    brokenWikilinks: [],
    contradictions: [],
    stale: [],
    summary: {
      totals: {
        orphans: orphans.length,
        brokenWikilinks: 0,
        contradictions: 0,
        stale: 0,
      },
    },
  };
}

// ── filterOrphans unit tests ──────────────────────────────────────────────────

describe("filterOrphans", () => {
  it("excludes archived notes by default (includeArchived=false)", () => {
    const result = makeResult([
      makeOrphan("real-note", "id-1", false),
      makeOrphan("archived-note", "id-2", true),
    ]);

    const filtered = filterOrphans(result, false, false);

    expect(filtered.orphans).toHaveLength(1);
    expect(filtered.orphans[0].id).toBe("id-1");
  });

  it("excludes system notes (Wiki Activity Log, Wiki Index) by default", () => {
    const result = makeResult([
      makeOrphan("real-note", "id-1", false),
      makeOrphan("Wiki Activity Log", "id-sys-1", false),
      makeOrphan("Wiki Index", "id-sys-2", false),
    ]);

    const filtered = filterOrphans(result, false, false);

    expect(filtered.orphans).toHaveLength(1);
    expect(filtered.orphans[0].id).toBe("id-1");
  });

  it("excludes both archived and system notes in one pass", () => {
    const result = makeResult([
      makeOrphan("real-note", "id-1", false),
      makeOrphan("archived-note", "id-2", true),
      makeOrphan("Wiki Activity Log", "id-sys-1", false),
      makeOrphan("Wiki Index", "id-sys-2", false),
    ]);

    const filtered = filterOrphans(result, false, false);

    expect(filtered.orphans).toHaveLength(1);
    expect(filtered.orphans[0].id).toBe("id-1");
  });

  it("--include-archived returns archived notes", () => {
    const result = makeResult([
      makeOrphan("real-note", "id-1", false),
      makeOrphan("archived-note", "id-2", true),
    ]);

    const filtered = filterOrphans(result, true, false);

    expect(filtered.orphans).toHaveLength(2);
    expect(filtered.orphans.map((o) => o.id)).toContain("id-2");
  });

  it("--include-system returns system notes", () => {
    const result = makeResult([
      makeOrphan("real-note", "id-1", false),
      makeOrphan("Wiki Activity Log", "id-sys-1", false),
    ]);

    const filtered = filterOrphans(result, false, true);

    expect(filtered.orphans).toHaveLength(2);
    expect(filtered.orphans.map((o) => o.title)).toContain("Wiki Activity Log");
  });

  it("summary totals match displayed list after filtering", () => {
    const result = makeResult([
      makeOrphan("real-note", "id-1", false),
      makeOrphan("archived-note", "id-2", true),
      makeOrphan("Wiki Activity Log", "id-sys-1", false),
    ]);

    const filtered = filterOrphans(result, false, false);

    expect(filtered.orphans).toHaveLength(1);
    expect(filtered.summary.totals.orphans).toBe(1);
  });

  it("summary totals are unchanged when no items are filtered", () => {
    const result = makeResult([
      makeOrphan("real-note-a", "id-1", false),
      makeOrphan("real-note-b", "id-2", false),
    ]);

    const filtered = filterOrphans(result, false, false);

    // Returns same reference when nothing changed
    expect(filtered).toBe(result);
    expect(filtered.summary.totals.orphans).toBe(2);
  });

  it("SYSTEM_NOTE_TITLES covers Wiki Activity Log and Wiki Index", () => {
    expect(SYSTEM_NOTE_TITLES).toContain("Wiki Activity Log");
    expect(SYSTEM_NOTE_TITLES).toContain("Wiki Index");
  });
});

// ── lintAction integration tests ──────────────────────────────────────────────

describe("lintAction.run", () => {
  let mockWikiLint: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockWikiLint = vi.fn();
    vi.mocked(clientModule.createClient).mockReturnValue({
      wikiLint: mockWikiLint,
    } as unknown as ReturnType<typeof clientModule.createClient>);
  });

  it("filters orphans by default (no flags)", async () => {
    const raw = makeResult([
      makeOrphan("real-note", "id-1", false),
      makeOrphan("Wiki Activity Log", "id-sys", false),
      makeOrphan("archived-note", "id-arch", true),
    ]);
    mockWikiLint.mockResolvedValue(raw);

    const result = await lintAction.run({}, ctx);

    expect(result.orphans).toHaveLength(1);
    expect(result.orphans[0].id).toBe("id-1");
    expect(result.summary.totals.orphans).toBe(1);
  });

  it("passes --include-archived through to filterOrphans", async () => {
    const raw = makeResult([
      makeOrphan("real-note", "id-1", false),
      makeOrphan("archived-note", "id-arch", true),
    ]);
    mockWikiLint.mockResolvedValue(raw);

    const result = await lintAction.run({ includeArchived: true }, ctx);

    expect(result.orphans).toHaveLength(2);
  });

  it("passes --include-system through to filterOrphans", async () => {
    const raw = makeResult([
      makeOrphan("real-note", "id-1", false),
      makeOrphan("Wiki Index", "id-sys", false),
    ]);
    mockWikiLint.mockResolvedValue(raw);

    const result = await lintAction.run({ includeSystem: true }, ctx);

    expect(result.orphans).toHaveLength(2);
  });
});
