import { describe, it, expect, vi, beforeEach } from "vitest";
import { lintAction, filterOrphans, filterNotesOnly, SYSTEM_NOTE_TITLES } from "../wiki/lint";
import type { ActionContext } from "../_register-group";
import type {
  WikiLintResult,
  WikiLintOrphan,
  WikiLintBrokenWikilink,
  WikiLintContradiction,
  WikiLintStale,
} from "../../client";

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
  isKb = false,
): WikiLintOrphan {
  return { id, title, updatedAt: "2026-05-01T00:00:00Z", archived, isKb };
}

function makeBroken(noteId: string, noteTitle: string, target: string, isKb = false): WikiLintBrokenWikilink {
  return { noteId, noteTitle, target, isKb };
}

function makeContradiction(
  idA: string,
  idB: string,
  isKbA = false,
  isKbB = false,
): WikiLintContradiction {
  return {
    id: `c-${idA}-${idB}`,
    noteA: { id: idA, title: `Note ${idA}`, isKb: isKbA },
    noteB: { id: idB, title: `Note ${idB}`, isKb: isKbB },
    similarity: 0.9,
    confidence: 0.8,
    description: null,
    scannedAt: "2026-05-01T00:00:00Z",
  };
}

function makeStale(id: string, isKb = false): WikiLintStale {
  return {
    id,
    title: `Stale ${id}`,
    updatedAt: "2025-01-01T00:00:00Z",
    isKb,
    referencedBy: { id: `ref-${id}`, title: `Ref ${id}`, updatedAt: "2026-04-01T00:00:00Z", isKb: false },
  };
}

function makeResult(
  orphans: WikiLintOrphan[] = [],
  brokenWikilinks: WikiLintBrokenWikilink[] = [],
  contradictions: WikiLintContradiction[] = [],
  stale: WikiLintStale[] = [],
): WikiLintResult {
  return {
    orphans,
    brokenWikilinks,
    contradictions,
    stale,
    summary: {
      totals: {
        orphans: orphans.length,
        brokenWikilinks: brokenWikilinks.length,
        contradictions: contradictions.length,
        stale: stale.length,
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

// ── filterNotesOnly unit tests ────────────────────────────────────────────────

describe("filterNotesOnly", () => {
  it("removes kb orphans (isKb=true), keeps regular notes", () => {
    const result = makeResult([
      makeOrphan("regular", "id-1", false, false),
      makeOrphan("kb-entry", "id-kb", false, true),
    ]);

    const filtered = filterNotesOnly(result);

    expect(filtered.orphans).toHaveLength(1);
    expect(filtered.orphans[0].id).toBe("id-1");
    expect(filtered.summary.totals.orphans).toBe(1);
  });

  it("removes kb brokenWikilinks", () => {
    const result = makeResult(
      [],
      [
        makeBroken("n-1", "Regular Note", "Missing", false),
        makeBroken("n-kb", "KB Entry", "Also Missing", true),
      ],
    );

    const filtered = filterNotesOnly(result);

    expect(filtered.brokenWikilinks).toHaveLength(1);
    expect(filtered.brokenWikilinks[0].noteId).toBe("n-1");
    expect(filtered.summary.totals.brokenWikilinks).toBe(1);
  });

  it("removes contradictions where either note is a kb entry", () => {
    const result = makeResult(
      [],
      [],
      [
        makeContradiction("a1", "b1", false, false), // both regular — keep
        makeContradiction("a2", "b2", true, false),  // noteA is kb — remove
        makeContradiction("a3", "b3", false, true),  // noteB is kb — remove
        makeContradiction("a4", "b4", true, true),   // both kb — remove
      ],
    );

    const filtered = filterNotesOnly(result);

    expect(filtered.contradictions).toHaveLength(1);
    expect(filtered.contradictions[0].noteA.id).toBe("a1");
    expect(filtered.summary.totals.contradictions).toBe(1);
  });

  it("removes kb stale entries", () => {
    const result = makeResult([], [], [], [
      makeStale("s-1", false),
      makeStale("s-kb", true),
    ]);

    const filtered = filterNotesOnly(result);

    expect(filtered.stale).toHaveLength(1);
    expect(filtered.stale[0].id).toBe("s-1");
    expect(filtered.summary.totals.stale).toBe(1);
  });

  it("recomputes all four totals after mixed filtering", () => {
    const result = makeResult(
      [makeOrphan("regular", "o-1", false, false), makeOrphan("kb", "o-kb", false, true)],
      [makeBroken("n-1", "Regular", "X", false), makeBroken("n-kb", "KB", "Y", true)],
      [makeContradiction("a1", "b1", false, false), makeContradiction("a2", "b2", true, false)],
      [makeStale("s-1", false), makeStale("s-kb", true)],
    );

    const filtered = filterNotesOnly(result);

    expect(filtered.summary.totals).toEqual({
      orphans: 1,
      brokenWikilinks: 1,
      contradictions: 1,
      stale: 1,
    });
  });

  it("returns same reference when no items are kb entries", () => {
    const result = makeResult([
      makeOrphan("regular-a", "id-1", false, false),
      makeOrphan("regular-b", "id-2", false, false),
    ]);

    const filtered = filterNotesOnly(result);

    expect(filtered).toBe(result);
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

  it("--notes-only removes kb entries from all categories", async () => {
    const raw = makeResult(
      [makeOrphan("regular", "o-1", false, false), makeOrphan("kb", "o-kb", false, true)],
      [makeBroken("n-1", "Regular", "X", false), makeBroken("n-kb", "KB", "Y", true)],
      [makeContradiction("a1", "b1", false, false), makeContradiction("a2", "b2", true, false)],
      [makeStale("s-1", false), makeStale("s-kb", true)],
    );
    mockWikiLint.mockResolvedValue(raw);

    const result = await lintAction.run({ notesOnly: true }, ctx);

    expect(result.orphans).toHaveLength(1);
    expect(result.brokenWikilinks).toHaveLength(1);
    expect(result.contradictions).toHaveLength(1);
    expect(result.stale).toHaveLength(1);
    expect(result.summary.totals).toEqual({
      orphans: 1,
      brokenWikilinks: 1,
      contradictions: 1,
      stale: 1,
    });
  });

  it("--notes-only default false leaves kb entries in result", async () => {
    const raw = makeResult(
      [makeOrphan("regular", "o-1", false, false), makeOrphan("kb", "o-kb", false, true)],
    );
    mockWikiLint.mockResolvedValue(raw);

    const result = await lintAction.run({}, ctx);

    // kb orphan is not system/archived so filterOrphans won't remove it
    expect(result.orphans).toHaveLength(2);
  });
});
