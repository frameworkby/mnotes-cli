import { describe, it, expect, vi, beforeEach } from "vitest";
import { listAction } from "../note/list";
import type { ActionContext } from "../_register-group";

// ── shared mocks ─────────────────────────────────────────────────────────────

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: "ws-1",
  })),
}));

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({
    listNotes: vi.fn(),
  })),
}));

import * as clientModule from "../../client";

// ── helpers ───────────────────────────────────────────────────────────────────

const ctx: ActionContext = { json: false, globalOpts: {} };

function mockListNotes(data: unknown[] = []) {
  const listNotes = vi.fn().mockResolvedValue({ data, nextCursor: null });
  const client = { listNotes };
  vi.mocked(clientModule.createClient).mockReturnValue(client as never);
  return listNotes;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("listAction (mcpTool: list_notes) — --folder alias", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("--folder-id passes folderId to listNotes", async () => {
    const listNotes = mockListNotes();

    await listAction.run({ folderId: "folder-abc" }, ctx);

    expect(listNotes).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: "folder-abc" }),
    );
  });

  it("--folder alias passes folderId to listNotes identically", async () => {
    const listNotes = mockListNotes();

    await listAction.run({ folder: "folder-abc" }, ctx);

    expect(listNotes).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: "folder-abc" }),
    );
  });

  it("--folder-id takes precedence over --folder when both supplied", async () => {
    const listNotes = mockListNotes();

    await listAction.run({ folderId: "folder-primary", folder: "folder-alias" }, ctx);

    expect(listNotes).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: "folder-primary" }),
    );
  });

  it("omits folderId when neither flag is supplied", async () => {
    const listNotes = mockListNotes();

    await listAction.run({}, ctx);

    expect(listNotes).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: undefined }),
    );
  });

  it("returns notes and nextCursor in MCP shape", async () => {
    const notes = [
      { id: "n-1", title: "Note One", updatedAt: new Date().toISOString() },
    ];
    mockListNotes(notes);

    const result = await listAction.run({ folderId: "folder-abc" }, ctx);

    expect(result).toEqual({ notes, nextCursor: null });
  });
});
