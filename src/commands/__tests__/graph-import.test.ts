import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { importGraphAction, attachSnippets } from "../graph/import";
import { listBuildsAction } from "../graph/builds";
import { deleteBuildAction } from "../graph/delete-build";
import { resolveConfig } from "../../config";
import type { ActionContext } from "../_register-group";
import type { GraphBuildRecord } from "../../client";

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return { ...actual, statSync: vi.fn(actual.statSync) };
});

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: "ws-1",
  })),
}));

const mockImport = vi.fn();
const mockList = vi.fn();
const mockDelete = vi.fn();

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({
    importGraphBuild: mockImport,
    listGraphBuilds: mockList,
    deleteGraphBuild: mockDelete,
  })),
}));

const FIXTURE = join(__dirname, "fixtures", "graphify-graph.json");
const ctx: ActionContext = { json: false, globalOpts: {} };

function makeBuild(overrides: Partial<GraphBuildRecord> = {}): GraphBuildRecord {
  return {
    id: "b1",
    name: "repo",
    workspaceId: "ws-1",
    rootPath: null,
    commitSha: null,
    tool: "graphify",
    toolVersion: "0.9.97",
    createdAt: "2026-11-02T00:00:00.000Z",
    stats: { nodes: 40, edges: 146, communities: 17, droppedLinks: 0, hyperedgesIgnored: 0, layoutMs: 1, importMs: 2 },
    url: "/graph/builds/b1",
    ...overrides,
  };
}

function sentBody(): Record<string, unknown> {
  return mockImport.mock.calls[0][0] as Record<string, unknown>;
}

let tmp: string;
let logs: string[];

beforeEach(() => {
  vi.clearAllMocks();
  tmp = mkdtempSync(join(tmpdir(), "graph-import-"));
  mockImport.mockResolvedValue({ ...makeBuild(), replaced: false });
  logs = [];
  vi.spyOn(console, "log").mockImplementation((m: unknown) => {
    logs.push(String(m));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("graph import", () => {
  it("sends the fixture verbatim with workspaceId, name and toolVersion", async () => {
    await importGraphAction.run({ file: FIXTURE, name: "x" }, ctx);
    const body = sentBody();
    expect(body.workspaceId).toBe("ws-1");
    expect(body.name).toBe("x");
    expect(body.toolVersion).toBe("0.9.97");
    expect((body.graph as { nodes: unknown[] }).nodes).toHaveLength(40);
    expect(body).not.toHaveProperty("replace");
  });

  it("derives name from --root", async () => {
    await importGraphAction.run({ file: FIXTURE, root: "/some/where/my-repo" }, ctx);
    expect(sentBody().name).toBe("my-repo");
    expect(sentBody().rootPath).toBe("/some/where/my-repo");
  });

  it("derives name from the grandparent of graphify-out/", async () => {
    const dir = join(tmp, "proj-x", "graphify-out");
    mkdirSync(dir, { recursive: true });
    copyFileSync(FIXTURE, join(dir, "graph.json"));
    await importGraphAction.run({ file: join(dir, "graph.json") }, ctx);
    expect(sentBody().name).toBe("proj-x");
  });

  it("falls back to the cwd basename", async () => {
    await importGraphAction.run({ file: FIXTURE }, ctx);
    expect(sentBody().name).toBe(basename(process.cwd()));
  });

  it('treats --commit "" and --root "" as absent', async () => {
    await importGraphAction.run({ file: FIXTURE, name: "x", commit: "", root: "" }, ctx);
    expect(sentBody()).not.toHaveProperty("commitSha");
    expect(sentBody()).not.toHaveProperty("rootPath");
  });

  it("sends commitSha and replace: true when given", async () => {
    await importGraphAction.run({ file: FIXTURE, name: "x", commit: "abc123", replace: true }, ctx);
    expect(sentBody().commitSha).toBe("abc123");
    expect(sentBody().replace).toBe(true);
  });

  it("errors on a missing file", async () => {
    await expect(importGraphAction.run({ file: join(tmp, "nope.json") }, ctx)).rejects.toThrow(
      /^File not found: /,
    );
  });

  it("errors on invalid JSON", async () => {
    const f = join(tmp, "bad.json");
    writeFileSync(f, "{not json");
    await expect(importGraphAction.run({ file: f }, ctx)).rejects.toThrow(/^Not valid JSON: /);
  });

  it("errors when links is missing", async () => {
    const f = join(tmp, "nolinks.json");
    writeFileSync(f, JSON.stringify({ nodes: [] }));
    await expect(importGraphAction.run({ file: f }, ctx)).rejects.toThrow(
      "Not a graphify graph.json (expected nodes[] and links[])",
    );
  });

  it("errors when the file is over 30 MB", async () => {
    vi.mocked(fs.statSync).mockReturnValueOnce({ size: 31_000_000 } as fs.Stats);
    await expect(importGraphAction.run({ file: FIXTURE }, ctx)).rejects.toThrow(
      /is 31\.0 MB; the import limit is 30 MB/,
    );
    expect(mockImport).not.toHaveBeenCalled();
  });

  it("errors when no workspace is configured", async () => {
    vi.mocked(resolveConfig).mockReturnValueOnce({ apiKey: "k", baseUrl: "https://x", workspaceId: undefined });
    await expect(importGraphAction.run({ file: FIXTURE }, ctx)).rejects.toThrow(/No workspace configured/);
  });

  it("renders the absolute build URL and the replaced line", async () => {
    mockImport.mockResolvedValue({ ...makeBuild(), replaced: true });
    const input = { file: FIXTURE, name: "repo" };
    const out = await importGraphAction.run(input, ctx);
    importGraphAction.renderHuman!(out, input);
    expect(logs[0]).toBe("Replaced existing build.");
    expect(logs[1]).toBe(
      'Imported "repo": 40 nodes, 146 edges, 17 communities (0 links dropped) → https://mnotes.example.com/graph/builds/b1',
    );
    expect(logs[2]).toBe("(Build viewer page ships in Phase 2.)");
  });
});

describe("graph import snippets", () => {
  const fn = (over: Record<string, unknown> = {}) => ({
    id: "f", label: "f()", _callable: true, file_type: "code", source_file: "a.ts", source_location: "L3", ...over,
  });
  const lines = (n: number) => Array.from({ length: n }, (_, i) => `line ${i + 1}`).join("\n");
  type N = Parameters<typeof attachSnippets>[0][number];

  beforeEach(() => {
    writeFileSync(join(tmp, "a.ts"), lines(50));
  });

  it("slices up to 20 lines from the start line, or to the range end", () => {
    const nodes: N[] = [fn(), fn({ source_location: "L10-L12" }), fn({ source_location: "L49" })];
    expect(attachSnippets(nodes, tmp)).toEqual({ attached: 3, overBudget: 0 });
    expect(nodes[0].snippet!.split("\n")).toEqual(Array.from({ length: 20 }, (_, i) => `line ${i + 3}`));
    expect(nodes[1].snippet).toBe("line 10\nline 11\nline 12");
    expect(nodes[2].snippet).toBe("line 49\nline 50");
  });

  it("caps a snippet at 1500 chars", () => {
    writeFileSync(join(tmp, "long.ts"), "x".repeat(5000));
    const nodes: N[] = [fn({ source_file: "long.ts", source_location: "L1" })];
    attachSnippets(nodes, tmp);
    expect(nodes[0].snippet).toHaveLength(1500);
  });

  it("skips non-code nodes, missing files, binaries, > 1 MB files and missing locations", () => {
    writeFileSync(join(tmp, "bin.ts"), Buffer.from([0x61, 0x00, 0x62]));
    writeFileSync(join(tmp, "big.ts"), "y\n".repeat(600_000));
    const nodes: N[] = [
      { id: "a.ts", label: "a.ts", file_type: "code", source_file: "a.ts", source_location: "L1" }, // file node
      { id: "e", label: "e", type: "external", file_type: "concept", source_file: "a.ts", source_location: "L1" },
      { id: "d", label: "d", file_type: "document", source_file: "a.ts", source_location: "L1" },
      fn({ source_file: "nope.ts" }),
      fn({ source_file: "bin.ts", source_location: "L1" }),
      fn({ source_file: "big.ts", source_location: "L1" }),
      fn({ source_location: undefined }),
      fn({ source_location: "L999" }),
    ];
    expect(attachSnippets(nodes, tmp)).toEqual({ attached: 0, overBudget: 0 });
    for (const n of nodes) expect(n).not.toHaveProperty("snippet");
  });

  it("refuses paths that escape the root, including via symlink", () => {
    const root = join(tmp, "root");
    mkdirSync(root);
    symlinkSync(join(tmp, "a.ts"), join(root, "link.ts"));
    const nodes: N[] = [
      fn({ source_file: "../a.ts" }),
      fn({ source_file: join(tmp, "a.ts") }),
      fn({ source_file: "link.ts" }),
    ];
    expect(attachSnippets(nodes, root)).toEqual({ attached: 0, overBudget: 0 });
  });

  it("stops attaching once the budget is spent", () => {
    const nodes: N[] = [fn({ source_location: "L1-L1" }), fn({ source_location: "L2-L2" }), fn({ source_location: "L3-L3" })];
    // each snippet is JSON '"line N"' = 8 chars
    expect(attachSnippets(nodes, tmp, 16)).toEqual({ attached: 2, overBudget: 1 });
    expect(nodes[2]).not.toHaveProperty("snippet");
  });

  it("attaches snippets on import with --root, warns on budget, and honours --no-snippets", async () => {
    const f = join(tmp, "graph.json");
    writeFileSync(f, JSON.stringify({ nodes: [fn()], links: [] }));
    await importGraphAction.run({ file: f, name: "x", root: tmp }, ctx);
    expect((sentBody().graph as { nodes: N[] }).nodes[0].snippet).toMatch(/^line 3\n/);

    mockImport.mockClear();
    await importGraphAction.run({ file: f, name: "x", root: tmp, snippets: false }, ctx);
    expect((sentBody().graph as { nodes: N[] }).nodes[0]).not.toHaveProperty("snippet");

    mockImport.mockClear();
    await importGraphAction.run({ file: f, name: "x" }, ctx);
    expect((sentBody().graph as { nodes: N[] }).nodes[0]).not.toHaveProperty("snippet");
  });

  it("prints one warning line when the budget runs out", async () => {
    const f = join(tmp, "graph.json");
    writeFileSync(f, JSON.stringify({ nodes: [fn()], links: [] }));
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    vi.mocked(fs.statSync).mockReturnValueOnce({ size: 29_500_000 } as fs.Stats);
    await importGraphAction.run({ file: f, name: "x", root: tmp }, ctx);
    expect(stderr).toHaveBeenCalledWith("Snippet budget reached: attached 0 code snippets, skipped 1.\n");
  });
});

describe("graph builds", () => {
  it("returns { builds } for JSON mode", async () => {
    const payload = { builds: [makeBuild()] };
    mockList.mockResolvedValue(payload);
    expect(await listBuildsAction.run({}, { json: true, globalOpts: {} })).toEqual(payload);
    expect(mockList).toHaveBeenCalledWith("ws-1");
  });

  it("prints one line per build in human mode", () => {
    listBuildsAction.renderHuman!({ builds: [makeBuild(), makeBuild({ id: "b2", commitSha: "abc" })] });
    expect(logs).toEqual([
      "b1  repo  40n/146e  -  2026-11-02T00:00:00.000Z",
      "b2  repo  40n/146e  abc  2026-11-02T00:00:00.000Z",
    ]);
  });

  it("prints a hint when there are no builds", () => {
    listBuildsAction.renderHuman!({ builds: [] });
    expect(logs).toEqual(["No graph builds. Run: mnotes graph import <graph.json>"]);
  });
});

describe("graph delete-build", () => {
  it("calls the client with (id, workspaceId)", async () => {
    mockDelete.mockResolvedValue({ success: true, id: "b1" });
    await deleteBuildAction.run({ id: "b1" }, ctx);
    expect(mockDelete).toHaveBeenCalledWith("b1", "ws-1");
    deleteBuildAction.renderHuman!({ success: true, id: "b1" });
    expect(logs).toEqual(["Deleted build b1"]);
  });
});
