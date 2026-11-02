import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { importGraphAction } from "../graph/import";
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
