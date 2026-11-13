import { describe, it, expect, vi, afterEach } from "vitest";
import { printRelatedTasks } from "../../output";
import { searchNotesAction } from "../note/search";
import { recallAction } from "../kb/recall";
import type { ActionContext } from "../_register-group";
import type { RelatedTask } from "../../client";

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({ apiKey: "k", baseUrl: "https://x", workspaceId: "ws1" })),
}));
vi.mock("../../client", () => ({ createClient: vi.fn() }));

import * as clientModule from "../../client";

const ctx: ActionContext = { json: true, globalOpts: {} };
const related: RelatedTask[] = [
  { id: "t1", title: "Wire auth", status: "in_progress", assignee: "claude-code", matchedVia: "note:n1" },
  { id: "t2", title: "Auth docs", status: "done", assignee: null, matchedVia: "text" },
];

afterEach(() => vi.restoreAllMocks());

describe("related tasks footer", () => {
  it("renders one line per task with status label, assignee and match source", () => {
    const lines: string[] = [];
    printRelatedTasks(related, (l) => lines.push(l));
    expect(lines).toEqual([
      "",
      "Related tasks:",
      "  t1  [In progress] Wire auth  (@claude-code)  — via note n1",
      "  t2  [Done] Auth docs  — via text",
    ]);
  });

  it("prints nothing when absent (older server) or empty", () => {
    const write = vi.fn();
    printRelatedTasks(undefined, write);
    printRelatedTasks([], write);
    expect(write).not.toHaveBeenCalled();
  });

  it("note search passes relatedTasks through to --json output", async () => {
    vi.mocked(clientModule.createClient).mockReturnValue({
      searchNotes: vi.fn().mockResolvedValue({ data: { results: [{ id: "n1", title: "Auth" }], relatedTasks: related } }),
    } as never);
    const out = await searchNotesAction.run({ query: "auth" }, ctx);
    expect(JSON.parse(JSON.stringify(out))).toEqual({ results: [{ id: "n1", title: "Auth" }], relatedTasks: related });
  });

  it("kb recall returns { results, relatedTasks } and writes the footer to stderr", async () => {
    vi.mocked(clientModule.createClient).mockReturnValue({
      recallKnowledge: vi.fn().mockResolvedValue({ data: { results: [], relatedTasks: related } }),
    } as never);
    const out = await recallAction.run({ query: "auth" }, ctx);
    expect(out).toEqual({ results: [], relatedTasks: related });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    recallAction.renderHuman!(out);
    expect(log).toHaveBeenCalledWith("[]");
    expect(err.mock.calls.map((c) => c[0]).join("")).toContain("t1  [In progress] Wire auth");
  });
});
