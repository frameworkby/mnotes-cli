"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock the client module
vitest_1.vi.mock("../../../client", () => ({
    createClient: vitest_1.vi.fn(),
}));
// Mock readline module
let questionAnswers = [];
let questionIndex = 0;
vitest_1.vi.mock("readline", () => {
    return {
        createInterface: vitest_1.vi.fn(() => ({
            question: (query, cb) => {
                const answer = questionIndex < questionAnswers.length
                    ? questionAnswers[questionIndex]
                    : "";
                questionIndex++;
                setImmediate(() => cb(answer));
            },
            close: vitest_1.vi.fn(),
        })),
    };
});
const workspace_prompt_1 = require("../workspace-prompt");
const client_1 = require("../../../client");
const mockCreateClient = vitest_1.vi.mocked(client_1.createClient);
function createMockClient(overrides) {
    return {
        listNotes: vitest_1.vi.fn(),
        getNote: vitest_1.vi.fn(),
        searchNotes: vitest_1.vi.fn(),
        createNote: vitest_1.vi.fn(),
        updateNote: vitest_1.vi.fn(),
        deleteNote: vitest_1.vi.fn(),
        listWorkspaces: overrides.listWorkspaces ?? vitest_1.vi.fn(),
        createWorkspace: overrides.createWorkspace ?? vitest_1.vi.fn(),
    };
}
function setAnswers(lines) {
    questionAnswers = lines;
    questionIndex = 0;
}
(0, vitest_1.describe)("resolveWorkspaceInteractively", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.restoreAllMocks();
        questionAnswers = [];
        questionIndex = 0;
    });
    // =============================================================
    // AC-4: Single workspace — auto-select with confirmation
    // =============================================================
    (0, vitest_1.describe)("AC-4: single workspace auto-select", () => {
        (0, vitest_1.it)("auto-selects the only workspace when user confirms with Enter", async () => {
            const client = createMockClient({
                listWorkspaces: vitest_1.vi.fn().mockResolvedValue({
                    data: [{ id: "ws-1", name: "My Notes", slug: "my-notes", isDefault: true }],
                }),
            });
            mockCreateClient.mockReturnValue(client);
            setAnswers([""]);
            const result = await (0, workspace_prompt_1.resolveWorkspaceInteractively)("http://localhost:3000", "test-key");
            (0, vitest_1.expect)(result).toEqual({ id: "ws-1", name: "My Notes" });
        });
        (0, vitest_1.it)("auto-selects when user types 'y'", async () => {
            const client = createMockClient({
                listWorkspaces: vitest_1.vi.fn().mockResolvedValue({
                    data: [{ id: "ws-1", name: "My Notes", slug: "my-notes", isDefault: true }],
                }),
            });
            mockCreateClient.mockReturnValue(client);
            setAnswers(["y"]);
            const result = await (0, workspace_prompt_1.resolveWorkspaceInteractively)("http://localhost:3000", "test-key");
            (0, vitest_1.expect)(result).toEqual({ id: "ws-1", name: "My Notes" });
        });
        (0, vitest_1.it)("auto-selects when user types 'yes'", async () => {
            const client = createMockClient({
                listWorkspaces: vitest_1.vi.fn().mockResolvedValue({
                    data: [{ id: "ws-1", name: "My Notes", slug: "my-notes", isDefault: true }],
                }),
            });
            mockCreateClient.mockReturnValue(client);
            setAnswers(["yes"]);
            const result = await (0, workspace_prompt_1.resolveWorkspaceInteractively)("http://localhost:3000", "test-key");
            (0, vitest_1.expect)(result).toEqual({ id: "ws-1", name: "My Notes" });
        });
        (0, vitest_1.it)("prompts to create when user declines single workspace", async () => {
            const client = createMockClient({
                listWorkspaces: vitest_1.vi.fn().mockResolvedValue({
                    data: [{ id: "ws-1", name: "My Notes", slug: "my-notes", isDefault: true }],
                }),
                createWorkspace: vitest_1.vi.fn().mockResolvedValue({
                    data: { id: "ws-new", name: "my-project", slug: "my-project", isDefault: false },
                }),
            });
            mockCreateClient.mockReturnValue(client);
            setAnswers(["n", "my-project"]);
            const result = await (0, workspace_prompt_1.resolveWorkspaceInteractively)("http://localhost:3000", "test-key");
            (0, vitest_1.expect)(result).toEqual({ id: "ws-new", name: "my-project" });
            (0, vitest_1.expect)(client.createWorkspace).toHaveBeenCalledWith("my-project");
        });
    });
    // =============================================================
    // AC-1: Multiple workspaces — select or create
    // =============================================================
    (0, vitest_1.describe)("AC-1: multiple workspaces selection", () => {
        (0, vitest_1.it)("selects an existing workspace by number", async () => {
            const client = createMockClient({
                listWorkspaces: vitest_1.vi.fn().mockResolvedValue({
                    data: [
                        { id: "ws-1", name: "Work", slug: "work", isDefault: true },
                        { id: "ws-2", name: "Personal", slug: "personal", isDefault: false },
                    ],
                }),
            });
            mockCreateClient.mockReturnValue(client);
            setAnswers(["2"]);
            const result = await (0, workspace_prompt_1.resolveWorkspaceInteractively)("http://localhost:3000", "test-key");
            (0, vitest_1.expect)(result).toEqual({ id: "ws-2", name: "Personal" });
        });
        (0, vitest_1.it)("selects first workspace by number", async () => {
            const client = createMockClient({
                listWorkspaces: vitest_1.vi.fn().mockResolvedValue({
                    data: [
                        { id: "ws-1", name: "Work", slug: "work", isDefault: true },
                        { id: "ws-2", name: "Personal", slug: "personal", isDefault: false },
                    ],
                }),
            });
            mockCreateClient.mockReturnValue(client);
            setAnswers(["1"]);
            const result = await (0, workspace_prompt_1.resolveWorkspaceInteractively)("http://localhost:3000", "test-key");
            (0, vitest_1.expect)(result).toEqual({ id: "ws-1", name: "Work" });
        });
        (0, vitest_1.it)("creates new workspace when selecting create option", async () => {
            const client = createMockClient({
                listWorkspaces: vitest_1.vi.fn().mockResolvedValue({
                    data: [
                        { id: "ws-1", name: "Work", slug: "work", isDefault: true },
                    ],
                }),
                createWorkspace: vitest_1.vi.fn().mockResolvedValue({
                    data: { id: "ws-new", name: "new-ws", slug: "new-ws", isDefault: false },
                }),
            });
            mockCreateClient.mockReturnValue(client);
            // Option 2 = create new (1 workspace + 1 create option)
            setAnswers(["2", "new-ws"]);
            const result = await (0, workspace_prompt_1.resolveWorkspaceInteractively)("http://localhost:3000", "test-key");
            (0, vitest_1.expect)(result).toEqual({ id: "ws-new", name: "new-ws" });
        });
        (0, vitest_1.it)("throws on invalid selection", async () => {
            const client = createMockClient({
                listWorkspaces: vitest_1.vi.fn().mockResolvedValue({
                    data: [
                        { id: "ws-1", name: "Work", slug: "work", isDefault: true },
                        { id: "ws-2", name: "Personal", slug: "personal", isDefault: false },
                    ],
                }),
            });
            mockCreateClient.mockReturnValue(client);
            setAnswers(["99"]);
            await (0, vitest_1.expect)((0, workspace_prompt_1.resolveWorkspaceInteractively)("http://localhost:3000", "test-key")).rejects.toThrow("Invalid selection");
        });
    });
    // =============================================================
    // AC-2/AC-3: No workspaces — create new
    // =============================================================
    (0, vitest_1.describe)("AC-2/AC-3: no workspaces — create new", () => {
        (0, vitest_1.it)("prompts to create workspace with custom name", async () => {
            const client = createMockClient({
                listWorkspaces: vitest_1.vi.fn().mockResolvedValue({ data: [] }),
                createWorkspace: vitest_1.vi.fn().mockResolvedValue({
                    data: { id: "ws-new", name: "my-project", slug: "my-project", isDefault: false },
                }),
            });
            mockCreateClient.mockReturnValue(client);
            setAnswers(["my-project"]);
            const result = await (0, workspace_prompt_1.resolveWorkspaceInteractively)("http://localhost:3000", "test-key");
            (0, vitest_1.expect)(result).toEqual({ id: "ws-new", name: "my-project" });
            (0, vitest_1.expect)(client.createWorkspace).toHaveBeenCalledWith("my-project");
        });
        (0, vitest_1.it)("defaults to directory name when user presses Enter", async () => {
            const client = createMockClient({
                listWorkspaces: vitest_1.vi.fn().mockResolvedValue({ data: [] }),
                createWorkspace: vitest_1.vi.fn().mockImplementation((name) => Promise.resolve({
                    data: { id: "ws-new", name, slug: name, isDefault: false },
                })),
            });
            mockCreateClient.mockReturnValue(client);
            setAnswers([""]);
            const result = await (0, workspace_prompt_1.resolveWorkspaceInteractively)("http://localhost:3000", "test-key");
            (0, vitest_1.expect)(result.id).toBe("ws-new");
            (0, vitest_1.expect)(client.createWorkspace).toHaveBeenCalled();
            const calledName = client.createWorkspace.mock.calls[0][0];
            (0, vitest_1.expect)(typeof calledName).toBe("string");
            (0, vitest_1.expect)(calledName.length).toBeGreaterThan(0);
        });
    });
    // =============================================================
    // AC-6: Error handling
    // =============================================================
    (0, vitest_1.describe)("AC-6: error handling", () => {
        (0, vitest_1.it)("throws clear error when workspace list API fails", async () => {
            const client = createMockClient({
                listWorkspaces: vitest_1.vi.fn().mockRejectedValue(new Error("HTTP 401: Unauthorized")),
            });
            mockCreateClient.mockReturnValue(client);
            await (0, vitest_1.expect)((0, workspace_prompt_1.resolveWorkspaceInteractively)("http://localhost:3000", "bad-key")).rejects.toThrow("Failed to fetch workspaces: HTTP 401: Unauthorized");
        });
        (0, vitest_1.it)("throws clear error when workspace creation fails", async () => {
            const client = createMockClient({
                listWorkspaces: vitest_1.vi.fn().mockResolvedValue({ data: [] }),
                createWorkspace: vitest_1.vi.fn().mockRejectedValue(new Error("HTTP 400: Validation failed")),
            });
            mockCreateClient.mockReturnValue(client);
            setAnswers(["test-ws"]);
            await (0, vitest_1.expect)((0, workspace_prompt_1.resolveWorkspaceInteractively)("http://localhost:3000", "test-key")).rejects.toThrow("Failed to create workspace: HTTP 400: Validation failed");
        });
    });
});
