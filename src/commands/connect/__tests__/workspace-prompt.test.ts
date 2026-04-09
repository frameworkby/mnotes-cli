import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the client module
vi.mock("../../../client", () => ({
  createClient: vi.fn(),
}));

// Mock readline module
let questionAnswers: string[] = [];
let questionIndex = 0;

vi.mock("readline", () => {
  return {
    createInterface: vi.fn(() => ({
      question: (query: string, cb: (answer: string) => void) => {
        const answer = questionIndex < questionAnswers.length
          ? questionAnswers[questionIndex]!
          : "";
        questionIndex++;
        setImmediate(() => cb(answer));
      },
      close: vi.fn(),
    })),
  };
});

import { resolveWorkspaceInteractively } from "../workspace-prompt";
import { createClient } from "../../../client";

const mockCreateClient = vi.mocked(createClient);

function createMockClient(overrides: {
  listWorkspaces?: () => Promise<unknown>;
  createWorkspace?: (name: string) => Promise<unknown>;
}) {
  return {
    listNotes: vi.fn(),
    getNote: vi.fn(),
    searchNotes: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    listWorkspaces: overrides.listWorkspaces ?? vi.fn(),
    createWorkspace: overrides.createWorkspace ?? vi.fn(),
  } as unknown as ReturnType<typeof createClient>;
}

function setAnswers(lines: string[]): void {
  questionAnswers = lines;
  questionIndex = 0;
}

describe("resolveWorkspaceInteractively", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    questionAnswers = [];
    questionIndex = 0;
  });

  // =============================================================
  // AC-4: Single workspace — auto-select with confirmation
  // =============================================================
  describe("AC-4: single workspace auto-select", () => {
    it("auto-selects the only workspace when user confirms with Enter", async () => {
      const client = createMockClient({
        listWorkspaces: vi.fn().mockResolvedValue({
          data: [{ id: "ws-1", name: "My Notes", slug: "my-notes", isDefault: true }],
        }),
      });
      mockCreateClient.mockReturnValue(client);
      setAnswers([""]);

      const result = await resolveWorkspaceInteractively("http://localhost:3000", "test-key");

      expect(result).toEqual({ id: "ws-1", name: "My Notes" });
    });

    it("auto-selects when user types 'y'", async () => {
      const client = createMockClient({
        listWorkspaces: vi.fn().mockResolvedValue({
          data: [{ id: "ws-1", name: "My Notes", slug: "my-notes", isDefault: true }],
        }),
      });
      mockCreateClient.mockReturnValue(client);
      setAnswers(["y"]);

      const result = await resolveWorkspaceInteractively("http://localhost:3000", "test-key");

      expect(result).toEqual({ id: "ws-1", name: "My Notes" });
    });

    it("auto-selects when user types 'yes'", async () => {
      const client = createMockClient({
        listWorkspaces: vi.fn().mockResolvedValue({
          data: [{ id: "ws-1", name: "My Notes", slug: "my-notes", isDefault: true }],
        }),
      });
      mockCreateClient.mockReturnValue(client);
      setAnswers(["yes"]);

      const result = await resolveWorkspaceInteractively("http://localhost:3000", "test-key");

      expect(result).toEqual({ id: "ws-1", name: "My Notes" });
    });

    it("prompts to create when user declines single workspace", async () => {
      const client = createMockClient({
        listWorkspaces: vi.fn().mockResolvedValue({
          data: [{ id: "ws-1", name: "My Notes", slug: "my-notes", isDefault: true }],
        }),
        createWorkspace: vi.fn().mockResolvedValue({
          data: { id: "ws-new", name: "my-project", slug: "my-project", isDefault: false },
        }),
      });
      mockCreateClient.mockReturnValue(client);
      setAnswers(["n", "my-project"]);

      const result = await resolveWorkspaceInteractively("http://localhost:3000", "test-key");

      expect(result).toEqual({ id: "ws-new", name: "my-project" });
      expect(client.createWorkspace).toHaveBeenCalledWith("my-project");
    });
  });

  // =============================================================
  // AC-1: Multiple workspaces — select or create
  // =============================================================
  describe("AC-1: multiple workspaces selection", () => {
    it("selects an existing workspace by number", async () => {
      const client = createMockClient({
        listWorkspaces: vi.fn().mockResolvedValue({
          data: [
            { id: "ws-1", name: "Work", slug: "work", isDefault: true },
            { id: "ws-2", name: "Personal", slug: "personal", isDefault: false },
          ],
        }),
      });
      mockCreateClient.mockReturnValue(client);
      setAnswers(["2"]);

      const result = await resolveWorkspaceInteractively("http://localhost:3000", "test-key");

      expect(result).toEqual({ id: "ws-2", name: "Personal" });
    });

    it("selects first workspace by number", async () => {
      const client = createMockClient({
        listWorkspaces: vi.fn().mockResolvedValue({
          data: [
            { id: "ws-1", name: "Work", slug: "work", isDefault: true },
            { id: "ws-2", name: "Personal", slug: "personal", isDefault: false },
          ],
        }),
      });
      mockCreateClient.mockReturnValue(client);
      setAnswers(["1"]);

      const result = await resolveWorkspaceInteractively("http://localhost:3000", "test-key");

      expect(result).toEqual({ id: "ws-1", name: "Work" });
    });

    it("creates new workspace when selecting create option", async () => {
      const client = createMockClient({
        listWorkspaces: vi.fn().mockResolvedValue({
          data: [
            { id: "ws-1", name: "Work", slug: "work", isDefault: true },
          ],
        }),
        createWorkspace: vi.fn().mockResolvedValue({
          data: { id: "ws-new", name: "new-ws", slug: "new-ws", isDefault: false },
        }),
      });
      mockCreateClient.mockReturnValue(client);
      // Option 2 = create new (1 workspace + 1 create option)
      setAnswers(["2", "new-ws"]);

      const result = await resolveWorkspaceInteractively("http://localhost:3000", "test-key");

      expect(result).toEqual({ id: "ws-new", name: "new-ws" });
    });

    it("throws on invalid selection", async () => {
      const client = createMockClient({
        listWorkspaces: vi.fn().mockResolvedValue({
          data: [
            { id: "ws-1", name: "Work", slug: "work", isDefault: true },
            { id: "ws-2", name: "Personal", slug: "personal", isDefault: false },
          ],
        }),
      });
      mockCreateClient.mockReturnValue(client);
      setAnswers(["99"]);

      await expect(
        resolveWorkspaceInteractively("http://localhost:3000", "test-key")
      ).rejects.toThrow("Invalid selection");
    });
  });

  // =============================================================
  // AC-2/AC-3: No workspaces — create new
  // =============================================================
  describe("AC-2/AC-3: no workspaces — create new", () => {
    it("prompts to create workspace with custom name", async () => {
      const client = createMockClient({
        listWorkspaces: vi.fn().mockResolvedValue({ data: [] }),
        createWorkspace: vi.fn().mockResolvedValue({
          data: { id: "ws-new", name: "my-project", slug: "my-project", isDefault: false },
        }),
      });
      mockCreateClient.mockReturnValue(client);
      setAnswers(["my-project"]);

      const result = await resolveWorkspaceInteractively("http://localhost:3000", "test-key");

      expect(result).toEqual({ id: "ws-new", name: "my-project" });
      expect(client.createWorkspace).toHaveBeenCalledWith("my-project");
    });

    it("defaults to directory name when user presses Enter", async () => {
      const client = createMockClient({
        listWorkspaces: vi.fn().mockResolvedValue({ data: [] }),
        createWorkspace: vi.fn().mockImplementation((name: string) =>
          Promise.resolve({
            data: { id: "ws-new", name, slug: name, isDefault: false },
          })
        ),
      });
      mockCreateClient.mockReturnValue(client);
      setAnswers([""]);

      const result = await resolveWorkspaceInteractively("http://localhost:3000", "test-key");

      expect(result.id).toBe("ws-new");
      expect(client.createWorkspace).toHaveBeenCalled();
      const calledName = (client.createWorkspace as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(typeof calledName).toBe("string");
      expect(calledName.length).toBeGreaterThan(0);
    });
  });

  // =============================================================
  // AC-6: Error handling
  // =============================================================
  describe("AC-6: error handling", () => {
    it("throws clear error when workspace list API fails", async () => {
      const client = createMockClient({
        listWorkspaces: vi.fn().mockRejectedValue(new Error("HTTP 401: Unauthorized")),
      });
      mockCreateClient.mockReturnValue(client);

      await expect(
        resolveWorkspaceInteractively("http://localhost:3000", "bad-key")
      ).rejects.toThrow("Failed to fetch workspaces: HTTP 401: Unauthorized");
    });

    it("throws clear error when workspace creation fails", async () => {
      const client = createMockClient({
        listWorkspaces: vi.fn().mockResolvedValue({ data: [] }),
        createWorkspace: vi.fn().mockRejectedValue(new Error("HTTP 400: Validation failed")),
      });
      mockCreateClient.mockReturnValue(client);
      setAnswers(["test-ws"]);

      await expect(
        resolveWorkspaceInteractively("http://localhost:3000", "test-key")
      ).rejects.toThrow("Failed to create workspace: HTTP 400: Validation failed");
    });
  });
});
