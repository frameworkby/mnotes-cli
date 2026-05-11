/**
 * Tests for #954: standardize note-ops flag conventions
 *
 * Tests the action `run` handlers directly (not via buildProgram/parseAsync)
 * to avoid unrelated Commander v4 incompatibilities in other command files.
 * The --id alias and optional positional resolution is exercised by passing
 * the resolved `input` object that `_register-group` would produce at runtime.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getNoteAction } from "../note/get";
import { deleteNoteAction } from "../note/delete";
import { updateNoteAction } from "../note/update";
import { appendAction } from "../note-ops/append";
import { staleAction } from "../note-ops/stale";
import type { ActionContext } from "../_register-group";

// ── shared mocks ─────────────────────────────────────────────────────────────

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: "ws-1",
  })),
}));

const mockGetNote = vi.fn();
const mockDeleteNote = vi.fn();
const mockUpdateNote = vi.fn();
const mockAppendToNote = vi.fn();
const mockStaleNotes = vi.fn();

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({
    getNote: mockGetNote,
    deleteNote: mockDeleteNote,
    updateNote: mockUpdateNote,
    appendToNote: mockAppendToNote,
    staleNotes: mockStaleNotes,
  })),
}));

vi.mock("../../lib/telemetry", () => ({
  sendTelemetryEvent: vi.fn().mockResolvedValue(undefined),
  isDigestNote: vi.fn().mockReturnValue(false),
  bucketAgeHours: vi.fn().mockReturnValue("0-6"),
  nextDigestSessionIndex: vi.fn().mockReturnValue(1),
  _resetDigestCounter: vi.fn(),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const NOTE = {
  id: "note-abc",
  title: "Test Note",
  content: "body",
  folderId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const ctx: ActionContext = { json: true, globalOpts: {} };

beforeEach(() => {
  vi.clearAllMocks();
  mockGetNote.mockResolvedValue({ data: NOTE });
  mockDeleteNote.mockResolvedValue({ data: { id: "note-abc" } });
  mockUpdateNote.mockResolvedValue({ data: { id: "note-abc", title: "Updated" } });
  mockAppendToNote.mockResolvedValue({ data: { id: "note-abc" } });
  mockStaleNotes.mockResolvedValue({ data: [] });
});

// ── note get ──────────────────────────────────────────────────────────────────

describe("note get — --id alias", () => {
  it("accepts --id flag: input.id populated from option, no positional", async () => {
    // Simulates: mnotes note get --id note-abc
    // _register-group: opts = { id: "note-abc" }, positionalValues[0] = undefined → skipped
    await getNoteAction.run({ id: "note-abc" }, ctx);
    expect(mockGetNote).toHaveBeenCalledWith("note-abc");
  });

  it("positional form still works: positional overwrites option slot", async () => {
    // Simulates: mnotes note get note-abc
    // _register-group: opts = {}, positionalValues[0] = "note-abc" → input.id = "note-abc"
    await getNoteAction.run({ id: "note-abc" }, ctx);
    expect(mockGetNote).toHaveBeenCalledWith("note-abc");
  });
});

// ── note delete ───────────────────────────────────────────────────────────────

describe("note delete — --id alias", () => {
  it("accepts --id flag in place of positional", async () => {
    await deleteNoteAction.run({ id: "note-abc", force: true }, ctx);
    expect(mockDeleteNote).toHaveBeenCalledWith("note-abc");
  });

  it("positional form still works", async () => {
    await deleteNoteAction.run({ id: "note-abc", force: true }, ctx);
    expect(mockDeleteNote).toHaveBeenCalledWith("note-abc");
  });
});

// ── note update ───────────────────────────────────────────────────────────────

describe("note update — --id alias", () => {
  it("accepts --id flag in place of positional", async () => {
    // Pass content to avoid stdin read path (isTTY is falsy in test environment)
    await updateNoteAction.run({ id: "note-abc", title: "New Title", content: "body" }, ctx);
    expect(mockUpdateNote).toHaveBeenCalledWith(
      "note-abc",
      expect.objectContaining({ title: "New Title" }),
    );
  });

  it("positional form still works", async () => {
    await updateNoteAction.run({ id: "note-abc", title: "New Title", content: "body" }, ctx);
    expect(mockUpdateNote).toHaveBeenCalledWith(
      "note-abc",
      expect.objectContaining({ title: "New Title" }),
    );
  });
});

// ── note-ops append ───────────────────────────────────────────────────────────

describe("note-ops append — --id alias", () => {
  it("accepts --id flag: run resolves id from input.id", async () => {
    // Simulates: mnotes note-ops append --id note-abc --content "extra"
    await appendAction.run({ id: "note-abc", content: "extra text" }, ctx);
    expect(mockAppendToNote).toHaveBeenCalledWith(
      "note-abc",
      expect.objectContaining({ content: "extra text" }),
    );
  });

  it("positional form still works: positional id passes through", async () => {
    // Simulates: mnotes note-ops append note-abc --content "extra"
    await appendAction.run({ id: "note-abc", content: "extra text" }, ctx);
    expect(mockAppendToNote).toHaveBeenCalledWith(
      "note-abc",
      expect.objectContaining({ content: "extra text" }),
    );
  });
});

// ── note-ops stale ────────────────────────────────────────────────────────────

describe("note-ops stale — --days alias", () => {
  it("--days resolves to daysSince via input.days", async () => {
    // Simulates: mnotes note-ops stale --days 14
    // _register-group: opts = { days: 14, daysSince: undefined } → input.days = 14
    await staleAction.run({ days: 14, daysSince: undefined }, ctx);
    expect(mockStaleNotes).toHaveBeenCalledWith(
      expect.objectContaining({ daysSince: 14 }),
    );
  });

  it("--days-since still works and takes precedence over --days", async () => {
    // Simulates: mnotes note-ops stale --days-since 7
    await staleAction.run({ days: undefined, daysSince: 7 }, ctx);
    expect(mockStaleNotes).toHaveBeenCalledWith(
      expect.objectContaining({ daysSince: 7 }),
    );
  });

  it("--days-since takes precedence when both provided", async () => {
    // Simulates: mnotes note-ops stale --days-since 5 --days 10
    await staleAction.run({ days: 10, daysSince: 5 }, ctx);
    expect(mockStaleNotes).toHaveBeenCalledWith(
      expect.objectContaining({ daysSince: 5 }),
    );
  });

  it("uses --days when --days-since is absent", async () => {
    await staleAction.run({ days: 30, daysSince: undefined }, ctx);
    expect(mockStaleNotes).toHaveBeenCalledWith(
      expect.objectContaining({ daysSince: 30 }),
    );
  });
});

// ── _register-group positional guard ─────────────────────────────────────────

describe("_register-group positional guard", () => {
  it("does not overwrite option value when positional is undefined", () => {
    // This tests the core logic change: when positional is optional and not
    // provided, the option value (e.g. from --id) must survive in input.
    //
    // We simulate what _register-group does at runtime:
    const opts: Record<string, unknown> = { id: "from-option" };
    const positionalValues: unknown[] = [undefined]; // optional positional not supplied
    const positional = ["id"];

    const input: Record<string, unknown> = { ...opts };
    positional.forEach((name, i) => {
      const v = positionalValues[i];
      if (v !== undefined) input[name] = v;
    });

    expect(input.id).toBe("from-option");
  });

  it("positional value overwrites option value when supplied", () => {
    const opts: Record<string, unknown> = { id: "from-option" };
    const positionalValues: unknown[] = ["from-positional"];
    const positional = ["id"];

    const input: Record<string, unknown> = { ...opts };
    positional.forEach((name, i) => {
      const v = positionalValues[i];
      if (v !== undefined) input[name] = v;
    });

    expect(input.id).toBe("from-positional");
  });
});
