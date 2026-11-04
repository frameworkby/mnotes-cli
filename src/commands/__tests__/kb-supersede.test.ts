import { describe, it, expect, vi, beforeEach } from "vitest";
import { supersedeAction } from "../kb/supersede";
import { resolveConfig } from "../../config";
import type { ActionContext } from "../_register-group";

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: "ws-1",
  })),
}));

const supersedeKnowledgeMock = vi.fn();

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({ supersedeKnowledge: supersedeKnowledgeMock })),
}));

const ctx: ActionContext = { json: false, globalOpts: {} };
const data = {
  noteId: "n-a",
  key: "db.engine",
  title: "DB engine",
  supersededById: "n-b",
  supersededBy: { id: "n-b", key: "db.engine.v2", title: "DB engine v2" },
  resolvedConflicts: 1,
};

beforeEach(() => {
  supersedeKnowledgeMock.mockReset();
  supersedeKnowledgeMock.mockResolvedValue({ data });
});

describe("supersedeAction", () => {
  it("key mode sends key/byKey and returns data unchanged", async () => {
    const out = await supersedeAction.run({ key: "db.engine", by: "db.engine.v2" }, ctx);
    expect(supersedeKnowledgeMock).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      key: "db.engine",
      noteId: undefined,
      byKey: "db.engine.v2",
      byNoteId: undefined,
      clear: undefined,
    });
    expect(out).toEqual(data);
  });

  it("id mode sends noteId/byNoteId", async () => {
    await supersedeAction.run({ id: "n-a", byId: "n-b" }, ctx);
    expect(supersedeKnowledgeMock).toHaveBeenCalledWith(
      expect.objectContaining({ noteId: "n-a", byNoteId: "n-b", key: undefined, byKey: undefined }),
    );
  });

  it("--clear sends clear: true", async () => {
    await supersedeAction.run({ key: "db.engine", clear: true }, ctx);
    expect(supersedeKnowledgeMock).toHaveBeenCalledWith(
      expect.objectContaining({ key: "db.engine", clear: true }),
    );
  });

  it.each([
    [{ by: "b" }, /exactly one of --key or --id/],
    [{ key: "a", id: "n", by: "b" }, /exactly one of --key or --id/],
    [{ key: "a" }, /exactly one of --by or --by-id/],
    [{ key: "a", by: "b", byId: "n" }, /exactly one of --by or --by-id/],
    [{ key: "a", by: "b", clear: true }, /--clear cannot be combined/],
  ])("rejects invalid flags %o", async (input, msg) => {
    await expect(supersedeAction.run(input, ctx)).rejects.toThrow(msg);
    expect(supersedeKnowledgeMock).not.toHaveBeenCalled();
  });

  it("throws without a workspace", async () => {
    vi.mocked(resolveConfig).mockReturnValueOnce({
      apiKey: "k",
      baseUrl: "https://x",
      workspaceId: undefined,
    } as ReturnType<typeof resolveConfig>);
    await expect(supersedeAction.run({ key: "a", by: "b" }, ctx)).rejects.toThrow(/No workspace/);
  });
});
