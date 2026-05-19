/**
 * Tests for mnotes-cli#1: --folder is an alias for --folder-id across
 * note-create paths and `kb ingest-external`.
 *
 * note/list.ts is already covered by note-list-folder-alias.test.ts; this
 * file exercises the three commands that the issue called out:
 *   - mnotes note create (ActionDescriptor `createNoteAction`)
 *   - mnotes kb ingest-external (ActionDescriptor `ingestExternalAction`)
 *
 * The legacy top-level `mnotes create` (src/commands/create.ts) is registered
 * via Commander's flat API and has no exported run() — its alias wiring is
 * verified by the type-check / build only.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNoteAction } from "../note/create";
import { ingestExternalAction } from "../kb/ingest-external";
import type { ActionContext } from "../_register-group";

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: "ws-1",
  })),
}));

const mockCreateNote = vi.fn();
const mockIngestExternal = vi.fn();

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({
    createNote: mockCreateNote,
    ingestExternal: mockIngestExternal,
  })),
}));

const ctx: ActionContext = { json: false, globalOpts: {} };

describe("mnotes note create — --folder / --folder-id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateNote.mockResolvedValue({ data: { id: "n1", title: "t" } });
  });

  it("--folder-id is forwarded as folderId", async () => {
    await createNoteAction.run({ title: "t", content: "x", folderId: "f-1" }, ctx);
    expect(mockCreateNote).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: "f-1" }),
    );
  });

  it("--folder alias is forwarded as folderId identically", async () => {
    await createNoteAction.run({ title: "t", content: "x", folder: "f-1" }, ctx);
    expect(mockCreateNote).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: "f-1" }),
    );
  });

  it("--folder-id wins when both flags are supplied", async () => {
    await createNoteAction.run(
      { title: "t", content: "x", folderId: "f-primary", folder: "f-alias" },
      ctx,
    );
    expect(mockCreateNote).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: "f-primary" }),
    );
  });
});

describe("mnotes kb ingest-external — --folder / --folder-id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIngestExternal.mockResolvedValue({ id: "n1", action: "created" });
  });

  const baseInput = {
    title: "t",
    content: "body",
    sourceType: "web_page" as const,
    sourceUrl: "https://example.com",
  };

  it("--folder-id is forwarded as folderId", async () => {
    await ingestExternalAction.run({ ...baseInput, folderId: "f-1" }, ctx);
    expect(mockIngestExternal).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: "f-1" }),
    );
  });

  it("--folder alias is forwarded as folderId identically", async () => {
    await ingestExternalAction.run({ ...baseInput, folder: "f-1" }, ctx);
    expect(mockIngestExternal).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: "f-1" }),
    );
  });

  it("--folder-id wins when both flags are supplied", async () => {
    await ingestExternalAction.run(
      { ...baseInput, folderId: "f-primary", folder: "f-alias" },
      ctx,
    );
    expect(mockIngestExternal).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: "f-primary" }),
    );
  });
});
