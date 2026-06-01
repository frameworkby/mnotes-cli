import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteEmptyFoldersAction } from "../folder/delete-empty";
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
    listEmptyFolders: vi.fn(),
    deleteFolder: vi.fn(),
  })),
}));

import * as clientModule from "../../client";

// ── helpers ───────────────────────────────────────────────────────────────────

const ctx: ActionContext = { json: false, globalOpts: {} };

function mockClient(methods: {
  listEmptyFolders?: ReturnType<typeof vi.fn>;
  deleteFolder?: ReturnType<typeof vi.fn>;
}) {
  const client = {
    listEmptyFolders: methods.listEmptyFolders ?? vi.fn().mockResolvedValue({ folderIds: [] }),
    deleteFolder: methods.deleteFolder ?? vi.fn().mockResolvedValue({ deleted: "x" }),
  };
  vi.mocked(clientModule.createClient).mockReturnValue(client as never);
  return client;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("deleteEmptyFoldersAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── run() ──────────────────────────────────────────────────────────────────

  describe("run — empty list", () => {
    it("returns empty arrays and does not call deleteFolder when no candidates", async () => {
      const client = mockClient({
        listEmptyFolders: vi.fn().mockResolvedValue({ folderIds: [] }),
      });

      const result = await deleteEmptyFoldersAction.run({}, ctx);

      expect(result).toEqual({ candidates: [], deleted: [], failed: [] });
      expect(client.deleteFolder).not.toHaveBeenCalled();
    });
  });

  describe("run — dry-run", () => {
    it("returns candidates but never calls deleteFolder", async () => {
      const client = mockClient({
        listEmptyFolders: vi.fn().mockResolvedValue({ folderIds: ["f-1", "f-2"] }),
      });

      const result = await deleteEmptyFoldersAction.run({ dryRun: true }, ctx);

      expect(result.candidates).toEqual(["f-1", "f-2"]);
      expect(result.deleted).toEqual([]);
      expect(result.failed).toEqual([]);
      expect(client.deleteFolder).not.toHaveBeenCalled();
    });

    it("dry-run with empty list still never calls deleteFolder", async () => {
      const client = mockClient({
        listEmptyFolders: vi.fn().mockResolvedValue({ folderIds: [] }),
      });

      await deleteEmptyFoldersAction.run({ dryRun: true }, ctx);

      expect(client.deleteFolder).not.toHaveBeenCalled();
    });
  });

  describe("run — non-dry-run deletion", () => {
    it("calls deleteFolder for each id in order and collects deleted ids", async () => {
      const ids = ["f-deep-2", "f-deep-1", "f-shallow"];
      const deleteFolder = vi.fn().mockResolvedValue({ deleted: "x" });
      mockClient({
        listEmptyFolders: vi.fn().mockResolvedValue({ folderIds: ids }),
        deleteFolder,
      });

      const result = await deleteEmptyFoldersAction.run({}, ctx);

      expect(deleteFolder).toHaveBeenCalledTimes(3);
      expect(deleteFolder.mock.calls.map((c) => c[0])).toEqual(ids);
      expect(result.deleted).toEqual(ids);
      expect(result.failed).toEqual([]);
    });

    it("records failures without throwing when deleteFolder rejects", async () => {
      const ids = ["f-1", "f-bad", "f-3"];
      const deleteFolder = vi.fn()
        .mockResolvedValueOnce({ deleted: "f-1" })
        .mockRejectedValueOnce(new Error("server error"))
        .mockResolvedValueOnce({ deleted: "f-3" });
      mockClient({
        listEmptyFolders: vi.fn().mockResolvedValue({ folderIds: ids }),
        deleteFolder,
      });

      const result = await deleteEmptyFoldersAction.run({}, ctx);

      expect(result.deleted).toEqual(["f-1", "f-3"]);
      expect(result.failed).toEqual([{ id: "f-bad", error: "server error" }]);
    });
  });

  describe("run — --folder scoping", () => {
    it("passes folderId to listEmptyFolders when --folder is set", async () => {
      const listEmptyFolders = vi.fn().mockResolvedValue({ folderIds: [] });
      mockClient({ listEmptyFolders });

      await deleteEmptyFoldersAction.run({ folder: "parent-folder-id" }, ctx);

      expect(listEmptyFolders).toHaveBeenCalledWith({
        workspaceId: "ws-1",
        folderId: "parent-folder-id",
      });
    });

    it("passes undefined folderId when --folder not set", async () => {
      const listEmptyFolders = vi.fn().mockResolvedValue({ folderIds: [] });
      mockClient({ listEmptyFolders });

      await deleteEmptyFoldersAction.run({}, ctx);

      expect(listEmptyFolders).toHaveBeenCalledWith({
        workspaceId: "ws-1",
        folderId: undefined,
      });
    });
  });

  // ── renderHuman() ──────────────────────────────────────────────────────────

  describe("renderHuman — dry-run", () => {
    it("prints 'No empty folders found' to stderr when candidates list is empty", () => {
      const lines: string[] = [];
      const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation((msg) => {
        lines.push(String(msg));
        return true;
      });

      deleteEmptyFoldersAction.renderHuman!(
        { candidates: [], deleted: [], failed: [] },
        { dryRun: true },
      );

      stderrSpy.mockRestore();
      expect(lines.join("")).toContain("No empty folders found");
    });

    it("prints summary line and candidate ids for dry-run with results", () => {
      const lines: string[] = [];
      const consoleSpy = vi.spyOn(console, "log").mockImplementation((...args) => {
        lines.push(args.join(" "));
      });

      deleteEmptyFoldersAction.renderHuman!(
        { candidates: ["f-1", "f-2"], deleted: [], failed: [] },
        { dryRun: true },
      );

      consoleSpy.mockRestore();
      const output = lines.join("\n");
      expect(output).toContain("dry-run");
      expect(output).toContain("candidates=2");
      expect(output).toContain("f-1");
      expect(output).toContain("f-2");
    });
  });

  describe("renderHuman — non-dry-run", () => {
    it("prints 'No empty folders found' when candidates list is empty", () => {
      const lines: string[] = [];
      const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation((msg) => {
        lines.push(String(msg));
        return true;
      });

      deleteEmptyFoldersAction.renderHuman!(
        { candidates: [], deleted: [], failed: [] },
        {},
      );

      stderrSpy.mockRestore();
      expect(lines.join("")).toContain("No empty folders found");
    });

    it("prints summary with candidates, deleted, failed counts", () => {
      const lines: string[] = [];
      const consoleSpy = vi.spyOn(console, "log").mockImplementation((...args) => {
        lines.push(args.join(" "));
      });

      deleteEmptyFoldersAction.renderHuman!(
        { candidates: ["f-1", "f-2"], deleted: ["f-1", "f-2"], failed: [] },
        {},
      );

      consoleSpy.mockRestore();
      const output = lines.join("\n");
      expect(output).toContain("candidates=2");
      expect(output).toContain("deleted=2");
      expect(output).toContain("failed=0");
    });

    it("prints +N more trailer when deleted list exceeds 10 items", () => {
      const ids = Array.from({ length: 13 }, (_, i) => `f-${i}`);
      const lines: string[] = [];
      const consoleSpy = vi.spyOn(console, "log").mockImplementation((...args) => {
        lines.push(args.join(" "));
      });

      deleteEmptyFoldersAction.renderHuman!(
        { candidates: ids, deleted: ids, failed: [] },
        {},
      );

      consoleSpy.mockRestore();
      const output = lines.join("\n");
      expect(output).toContain("+3 more");
    });

    it("prints failed entries with error messages", () => {
      const lines: string[] = [];
      const consoleSpy = vi.spyOn(console, "log").mockImplementation((...args) => {
        lines.push(args.join(" "));
      });

      deleteEmptyFoldersAction.renderHuman!(
        {
          candidates: ["f-1", "f-bad"],
          deleted: ["f-1"],
          failed: [{ id: "f-bad", error: "server error" }],
        },
        {},
      );

      consoleSpy.mockRestore();
      const output = lines.join("\n");
      expect(output).toContain("failed=1");
      expect(output).toContain("f-bad");
      expect(output).toContain("server error");
    });
  });
});
