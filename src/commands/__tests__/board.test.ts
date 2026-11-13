import { describe, it, expect, vi, beforeEach } from "vitest";
import { listBoardAction } from "../board/list";
import { createBoardAction } from "../board/create";
import { updateBoardAction } from "../board/update";
import { moveBoardAction } from "../board/move";
import { deleteBoardAction } from "../board/delete";
import type { ActionContext } from "../_register-group";

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: "ws-1",
  })),
}));

const listBoardTasks = vi.fn();
const createBoardTask = vi.fn();
const updateBoardTask = vi.fn();
const deleteBoardTask = vi.fn();

vi.mock("../../client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../client")>()),
  createClient: vi.fn(() => ({ listBoardTasks, createBoardTask, updateBoardTask, deleteBoardTask })),
}));

const ctx: ActionContext = { json: false, globalOpts: {} };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("board actions", () => {
  it("list splits --status and normalizes the in-progress alias", async () => {
    listBoardTasks.mockResolvedValue({ tasks: [] });
    await listBoardAction.run({ status: "todo,in-progress", assignee: "claude-code" }, ctx);
    expect(listBoardTasks).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      status: ["todo", "in_progress"],
      assignee: "claude-code",
      q: undefined,
      limit: undefined,
    });
  });

  it("list rejects an out-of-range or non-numeric --limit before calling the API", async () => {
    for (const limit of [NaN, 0, 501]) {
      await expect(listBoardAction.run({ limit }, ctx)).rejects.toThrow(/--limit must be an integer 1-500/);
    }
    expect(listBoardTasks).not.toHaveBeenCalled();
  });

  it("create passes repeatable --note-id as noteIds", async () => {
    createBoardTask.mockResolvedValue({ task: {} });
    await createBoardAction.run({ title: "Ship it", priority: "high", noteId: ["n1", "n2"] }, ctx);
    expect(createBoardTask).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: "ws-1", title: "Ship it", priority: "high", noteIds: ["n1", "n2"] }),
    );
  });

  it("move accepts in-progress and rejects unknown statuses before calling the API", async () => {
    updateBoardTask.mockResolvedValue({ task: {} });
    await moveBoardAction.run({ id: "t1", status: "in-progress" }, ctx);
    expect(updateBoardTask).toHaveBeenCalledWith("t1", { status: "in_progress" });

    await expect(moveBoardAction.run({ id: "t1", status: "doing" }, ctx)).rejects.toThrow(/Invalid status/);
    expect(updateBoardTask).toHaveBeenCalledTimes(1);
  });

  it("update --unassign sends assignee: null; --assignee with --unassign throws", async () => {
    updateBoardTask.mockResolvedValue({ task: {} });
    await updateBoardAction.run({ id: "t1", unassign: true }, ctx);
    expect(updateBoardTask).toHaveBeenCalledWith("t1", expect.objectContaining({ assignee: null }));

    await expect(updateBoardAction.run({ id: "t1", assignee: "x", unassign: true }, ctx)).rejects.toThrow(
      /mutually exclusive/,
    );
    await expect(updateBoardAction.run({ id: "t1" }, ctx)).rejects.toThrow(/Nothing to update/);
  });

  it("delete returns a JSON-friendly result", async () => {
    deleteBoardTask.mockResolvedValue(undefined);
    await expect(deleteBoardAction.run({ id: "t1" }, ctx)).resolves.toEqual({ id: "t1", deleted: true });
  });
});
