import { describe, it, expect, vi, beforeEach } from "vitest";
import { manageFoldersAction } from "../folder/manage";
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
    createFolder: vi.fn(),
    renameFolder: vi.fn(),
    deleteFolder: vi.fn(),
  })),
}));

import * as clientModule from "../../client";

// ── helpers ───────────────────────────────────────────────────────────────────

const ctx: ActionContext = { json: false, globalOpts: {} };

function makeFolderRecord(overrides: Partial<{
  id: string;
  name: string;
  parentId: string | null;
  isRoot: boolean;
  userId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  return {
    id: "folder-1",
    name: "My Folder",
    parentId: null,
    isRoot: false,
    userId: "user-1",
    workspaceId: "ws-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function mockClient(methods: {
  createFolder?: ReturnType<typeof vi.fn>;
  renameFolder?: ReturnType<typeof vi.fn>;
  deleteFolder?: ReturnType<typeof vi.fn>;
}) {
  const client = {
    createFolder: methods.createFolder ?? vi.fn(),
    renameFolder: methods.renameFolder ?? vi.fn(),
    deleteFolder: methods.deleteFolder ?? vi.fn(),
  };
  vi.mocked(clientModule.createClient).mockReturnValue(client as never);
  return client;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("manageFoldersAction (mcpTool: manage_folders)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("renderHuman — delete branch", () => {
    it("renders single-line confirmation with no stray } characters", () => {
      const output: { deleted: string } = { deleted: "folder-42" };
      const lines: string[] = [];
      const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation((msg) => {
        lines.push(String(msg));
        return true;
      });

      manageFoldersAction.renderHuman!(output);

      stderrSpy.mockRestore();

      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe("Folder folder-42 deleted\n");
      // Ensure no stray JSON artifact
      expect(lines[0]).not.toContain("}");
    });
  });

  describe("renderHuman — create/rename branch", () => {
    it("renders folder id and name for a folder record", () => {
      const output = makeFolderRecord({ id: "folder-1", name: "Work" });
      const lines: string[] = [];
      const consoleSpy = vi.spyOn(console, "log").mockImplementation((...args) => {
        lines.push(args.join(" "));
      });

      manageFoldersAction.renderHuman!(output);

      consoleSpy.mockRestore();

      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain("folder-1");
      expect(lines[0]).toContain("Work");
    });
  });

  describe("run — delete", () => {
    it("calls deleteFolder with the given id and returns { deleted: id }", async () => {
      const deleteFolder = vi.fn().mockResolvedValue({ deleted: "folder-99" });
      mockClient({ deleteFolder });

      const result = await manageFoldersAction.run({ action: "delete", id: "folder-99" }, ctx);

      expect(deleteFolder).toHaveBeenCalledWith("folder-99");
      expect(result).toEqual({ deleted: "folder-99" });
    });

    it("throws when --id is missing for delete", async () => {
      mockClient({});
      await expect(
        manageFoldersAction.run({ action: "delete" }, ctx),
      ).rejects.toThrow("--id is required for delete action");
    });
  });

  describe("run — create", () => {
    it("calls createFolder and returns the folder record", async () => {
      const folder = makeFolderRecord({ name: "New Folder" });
      const createFolder = vi.fn().mockResolvedValue(folder);
      mockClient({ createFolder });

      const result = await manageFoldersAction.run(
        { action: "create", name: "New Folder" },
        ctx,
      );

      expect(createFolder).toHaveBeenCalledWith({
        name: "New Folder",
        parentId: undefined,
        workspaceId: "ws-1",
      });
      expect(result).toEqual(folder);
    });
  });
});
