/**
 * Tests for #994: warn when note title contains '/'
 *
 * Tests `createNoteAction.run` directly (ActionDescriptor pattern) and
 * `registerCreateCommand` (legacy flat command) via buildProgram / parseAsync.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createNoteAction } from "../note/create";
import type { ActionContext } from "../_register-group";

// ── shared mocks ──────────────────────────────────────────────────────────────

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: "ws-1",
  })),
}));

const mockCreateNote = vi.fn();

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({
    createNote: mockCreateNote,
  })),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const NOTE_RESULT = { id: "note-xyz", title: "some/title" };
const ctx: ActionContext = { json: true, globalOpts: {} };

let stderrSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateNote.mockResolvedValue({ data: NOTE_RESULT });
  stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  // Ensure env var suppression is off by default
  delete process.env.MNOTES_SUPPRESS_TITLE_SLASH_WARNING;
});

afterEach(() => {
  stderrSpy.mockRestore();
  delete process.env.MNOTES_SUPPRESS_TITLE_SLASH_WARNING;
});

// ── note/create (ActionDescriptor) ───────────────────────────────────────────

describe("createNoteAction — slash warning", () => {
  it("emits warning to stderr when title has '/' and no folder", async () => {
    await createNoteAction.run({ title: "work/projects", content: "body" }, ctx);

    expect(stderrSpy).toHaveBeenCalledWith(
      "Tip: title contains '/'; did you mean to use --folder? (set MNOTES_SUPPRESS_TITLE_SLASH_WARNING=1 to silence)\n",
    );
    // Note is still created
    expect(mockCreateNote).toHaveBeenCalledOnce();
  });

  it("does NOT emit warning when title has '/' AND --folder is set", async () => {
    await createNoteAction.run(
      { title: "work/projects", content: "body", folder: "folder-1" },
      ctx,
    );

    expect(stderrSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Tip:"),
    );
    expect(mockCreateNote).toHaveBeenCalledOnce();
  });

  it("does NOT emit warning when MNOTES_SUPPRESS_TITLE_SLASH_WARNING=1", async () => {
    process.env.MNOTES_SUPPRESS_TITLE_SLASH_WARNING = "1";

    await createNoteAction.run({ title: "work/projects", content: "body" }, ctx);

    expect(stderrSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Tip:"),
    );
    expect(mockCreateNote).toHaveBeenCalledOnce();
  });

  it("does NOT emit warning when MNOTES_SUPPRESS_TITLE_SLASH_WARNING=true", async () => {
    process.env.MNOTES_SUPPRESS_TITLE_SLASH_WARNING = "true";

    await createNoteAction.run({ title: "work/projects", content: "body" }, ctx);

    expect(stderrSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Tip:"),
    );
    expect(mockCreateNote).toHaveBeenCalledOnce();
  });

  it("does NOT emit warning when title has no '/'", async () => {
    await createNoteAction.run({ title: "plain title", content: "body" }, ctx);

    expect(stderrSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Tip:"),
    );
    expect(mockCreateNote).toHaveBeenCalledOnce();
  });

  it("note is still created (non-rejecting) even when warning fires", async () => {
    await createNoteAction.run({ title: "a/b/c", content: "body" }, ctx);

    expect(mockCreateNote).toHaveBeenCalledWith(
      expect.objectContaining({ title: "a/b/c" }),
    );
  });
});

// ── legacy create.ts (registerCreateCommand) ─────────────────────────────────

describe("registerCreateCommand (legacy flat command) — slash warning", () => {
  // Re-mock stdin so readStdin never blocks (isTTY = true path)
  beforeEach(() => {
    Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(process.stdin, "isTTY", { value: undefined, configurable: true });
  });

  async function runCreate(args: string[], env?: Record<string, string>) {
    // Apply env overrides
    const saved: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(env ?? {})) {
      saved[k] = process.env[k];
      process.env[k] = v;
    }
    try {
      // Import fresh each time to avoid registry duplication
      const { buildProgram } = await import("../../index");
      const program = buildProgram();
      await program.parseAsync(["node", "mnotes", ...args]);
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  }

  it("emits warning when title has '/' and no --folder-id", async () => {
    await runCreate(["create", "--title", "work/projects"]);

    expect(stderrSpy).toHaveBeenCalledWith(
      "Tip: title contains '/'; did you mean to use --folder? (set MNOTES_SUPPRESS_TITLE_SLASH_WARNING=1 to silence)\n",
    );
    expect(mockCreateNote).toHaveBeenCalledOnce();
  });

  it("does NOT emit warning when --folder-id is set", async () => {
    await runCreate(["create", "--title", "work/projects", "--folder-id", "folder-1"]);

    expect(stderrSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Tip:"),
    );
    expect(mockCreateNote).toHaveBeenCalledOnce();
  });

  it("does NOT emit warning when MNOTES_SUPPRESS_TITLE_SLASH_WARNING=1", async () => {
    await runCreate(["create", "--title", "work/projects"], {
      MNOTES_SUPPRESS_TITLE_SLASH_WARNING: "1",
    });

    expect(stderrSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Tip:"),
    );
  });

  it("does NOT emit warning when title has no '/'", async () => {
    await runCreate(["create", "--title", "plain title"]);

    expect(stderrSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Tip:"),
    );
    expect(mockCreateNote).toHaveBeenCalledOnce();
  });
});
