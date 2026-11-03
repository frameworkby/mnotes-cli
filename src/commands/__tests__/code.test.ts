import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, delimiter, join } from "node:path";
import { codeStatusAction } from "../code/status";
import { codeSearchAction } from "../code/search";
import { codeShowAction } from "../code/show";
import { codeImpactAction } from "../code/impact";
import { codeRefreshAction } from "../code/refresh";
import * as shared from "../code/shared";
import { toRepoRelative } from "../code/shared";
import type { ActionContext } from "../_register-group";
import type { CodeNodeDetail, GraphBuildRecord } from "../../client";

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: "ws-1",
  })),
}));

vi.mock("../code/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../code/shared")>();
  return { ...actual, findGraphify: vi.fn(actual.findGraphify) };
});

const mockList = vi.fn();
const mockSearch = vi.fn();
const mockNode = vi.fn();
const mockImpact = vi.fn();
const mockImport = vi.fn();

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({
    listGraphBuilds: mockList,
    searchGraphBuild: mockSearch,
    getGraphBuildNode: mockNode,
    getGraphBuildImpact: mockImpact,
    importGraphBuild: mockImport,
  })),
}));

const FIXTURE = join(__dirname, "fixtures", "graphify-graph.json");
const ctx: ActionContext = { json: true, globalOpts: {} };
const isWin = process.platform === "win32";

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

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync(
    "git",
    ["-c", "user.name=t", "-c", "user.email=t@example.com", "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", ...args],
    { cwd, encoding: "utf8", shell: false },
  );
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}

let tmp: string;
let repo: string;
let head: string;
let logs: string[];
const savedEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(shared.findGraphify).mockReset(); // back to the real implementation
  logs = [];
  vi.spyOn(console, "log").mockImplementation((m: unknown) => {
    logs.push(String(m));
  });
  tmp = realpathSync.native(mkdtempSync(join(tmpdir(), "mnotes-code-")));
  repo = join(tmp, "my-repo");
  mkdirSync(join(repo, "src", "lib"), { recursive: true });
  writeFileSync(join(repo, "src", "lib", "a.ts"), "export const a = 1;\n");
  git(repo, "init", "-q");
  git(repo, "add", ".");
  git(repo, "commit", "-qm", "init");
  head = git(repo, "rev-parse", "--short", "HEAD");
  vi.spyOn(process, "cwd").mockReturnValue(repo);
  delete process.env.MNOTES_CODE_BUILD;
  mockList.mockResolvedValue({ builds: [] });
});

afterEach(() => {
  vi.restoreAllMocks();
  // Restore key by key: replacing process.env loses Windows' case-insensitive env.
  for (const k of Object.keys(process.env)) if (!(k in savedEnv)) delete process.env[k];
  Object.assign(process.env, savedEnv);
  rmSync(tmp, { recursive: true, force: true });
});

describe("build resolution", () => {
  it("defaults to the newest build named after the repo", async () => {
    mockList.mockResolvedValue({
      builds: [
        makeBuild({ id: "old", name: "my-repo", createdAt: "2026-01-01T00:00:00Z" }),
        makeBuild({ id: "new", name: "my-repo", createdAt: "2026-06-01T00:00:00Z" }),
        makeBuild({ id: "other", name: "other", createdAt: "2026-12-01T00:00:00Z" }),
      ],
    });
    const s = await codeStatusAction.run({}, ctx);
    expect(s.build?.id).toBe("new");
    expect(mockList).toHaveBeenCalledWith("ws-1", { name: "my-repo" });
  });

  it("uses the repo top-level name from a subdirectory", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(join(repo, "src"));
    mockList.mockResolvedValue({ builds: [makeBuild({ id: "x", name: "my-repo" })] });
    expect((await codeStatusAction.run({}, ctx)).build?.id).toBe("x");
  });

  it("--build matches a name, then an id; it beats MNOTES_CODE_BUILD", async () => {
    process.env.MNOTES_CODE_BUILD = "env-build";
    mockList.mockResolvedValue({
      builds: [
        makeBuild({ id: "b-id", name: "named" }),
        makeBuild({ id: "env", name: "env-build" }),
        makeBuild({ id: "def", name: "my-repo" }),
      ],
    });
    expect((await codeStatusAction.run({ build: "b-id" }, ctx)).build?.id).toBe("b-id");
    expect((await codeStatusAction.run({ build: "named" }, ctx)).build?.id).toBe("b-id");
    expect((await codeStatusAction.run({}, ctx)).build?.id).toBe("env");
  });

  it("errors with a graphify hint when no build matches", async () => {
    await expect(codeSearchAction.run({ query: "x" }, ctx)).rejects.toThrow(
      /No code graph build named "my-repo".*\/mnotes:graphify.*mnotes code refresh/,
    );
  });

  it("names the source of an unknown explicit build", async () => {
    process.env.MNOTES_CODE_BUILD = "ghost";
    await expect(codeSearchAction.run({ query: "x" }, ctx)).rejects.toThrow(/"ghost" \(from MNOTES_CODE_BUILD\)/);
  });
});

describe("code status", () => {
  it("returns build: null and stale: false without a build", async () => {
    const s = await codeStatusAction.run({}, ctx);
    expect(s).toEqual({ build: null, repoRoot: expect.any(String), head, behind: null, stale: false, dirty: false });
    expect(basename(s.repoRoot!)).toBe("my-repo");
  });

  it("is fresh at HEAD with a clean tree", async () => {
    mockList.mockResolvedValue({ builds: [makeBuild({ name: "my-repo", commitSha: head })] });
    const s = await codeStatusAction.run({}, ctx);
    expect(s.build).toEqual({
      id: "b1",
      name: "my-repo",
      commitSha: head,
      createdAt: "2026-11-02T00:00:00.000Z",
      stats: makeBuild().stats,
    });
    expect(s.behind).toBe(0);
    expect(s.stale).toBe(false);
  });

  it("counts commits behind and goes stale", async () => {
    mockList.mockResolvedValue({ builds: [makeBuild({ name: "my-repo", commitSha: head })] });
    writeFileSync(join(repo, "b.ts"), "export const b = 2;\n");
    git(repo, "add", ".");
    git(repo, "commit", "-qm", "two");
    const s = await codeStatusAction.run({}, ctx);
    expect(s.behind).toBe(1);
    expect(s.stale).toBe(true);
    expect(s.head).not.toBe(head);
  });

  it("reports modified tracked files as dirty without going stale; ignores untracked files", async () => {
    mockList.mockResolvedValue({ builds: [makeBuild({ name: "my-repo", commitSha: head })] });
    writeFileSync(join(repo, "untracked.ts"), "x\n");
    expect(await codeStatusAction.run({}, ctx)).toMatchObject({ stale: false, dirty: false });
    writeFileSync(join(repo, "src", "lib", "a.ts"), "export const a = 2;\n");
    const s = await codeStatusAction.run({}, ctx);
    expect(s).toMatchObject({ behind: 0, stale: false, dirty: true });
    codeStatusAction.renderHuman!(s);
    expect(logs[1]).toMatch(/\(0 commit\(s\) behind, uncommitted changes\)$/);
    expect(logs[2]).toBe("Up to date.");
  });

  it("--if-stale doesn't refresh a build that is only dirty", async () => {
    vi.mocked(shared.findGraphify).mockReturnValue(null);
    mockList.mockResolvedValue({ builds: [makeBuild({ name: "my-repo", commitSha: head })] });
    writeFileSync(join(repo, "src", "lib", "a.ts"), "export const a = 2;\n");
    const out = await codeRefreshAction.run({ ifStale: true }, ctx);
    expect(out).toMatchObject({ refreshed: false, reason: "up-to-date", before: { dirty: true, stale: false } });
  });

  it("reports behind: null (stale) for a sha unknown locally", async () => {
    mockList.mockResolvedValue({ builds: [makeBuild({ name: "my-repo", commitSha: "deadbee" })] });
    const s = await codeStatusAction.run({}, ctx);
    expect(s.behind).toBeNull();
    expect(s.stale).toBe(true);
  });

  it("outside a git repo uses the cwd name and is never stale", async () => {
    const plain = join(tmp, "plain-dir");
    mkdirSync(plain);
    vi.spyOn(process, "cwd").mockReturnValue(plain);
    mockList.mockResolvedValue({ builds: [makeBuild({ name: "plain-dir", commitSha: "abc1234" })] });
    const s = await codeStatusAction.run({}, ctx);
    expect(s.build?.name).toBe("plain-dir");
    expect(s).toMatchObject({ repoRoot: null, head: null, behind: null, stale: false, dirty: false });
  });
});

describe("code search", () => {
  it("passes query, type and limit and returns the build summary", async () => {
    mockList.mockResolvedValue({ builds: [makeBuild({ name: "my-repo", commitSha: head })] });
    const hit = { id: "n1", label: "createClient", nodeType: "function", sourceFile: "src/client.ts", sourceLocation: "L10", community: 1, degree: 7 };
    mockSearch.mockResolvedValue({ nodes: [hit] });
    const out = await codeSearchAction.run({ query: "createClient", type: "function", limit: 5 }, ctx);
    expect(mockSearch).toHaveBeenCalledWith("b1", "ws-1", { q: "createClient", type: "function", limit: 5 });
    expect(out).toEqual({ build: { id: "b1", name: "my-repo", commitSha: head }, nodes: [hit] });
    codeSearchAction.renderHuman!(out);
    expect(logs[0]).toBe("createClient  [function]  src/client.ts:L10  degree 7  id=n1");
  });
});

function nodeDetail(id = "n1"): CodeNodeDetail {
  const other = (oid: string, label: string) => ({ id: oid, label, nodeType: "function", sourceFile: "src/x.ts", sourceLocation: "L1" });
  return {
    node: {
      id, label: "createClient", nodeType: "function", sourceFile: "src/client.ts", sourceLocation: "L10",
      community: 2, communityName: "client", snippet: "export function createClient() {\n}", snippetStartLine: 10,
    },
    outgoing: [
      { edgeType: "calls", confidence: "EXTRACTED", other: other("o1", "request") },
      { edgeType: "imports_from", confidence: "EXTRACTED", other: other("o2", "config") },
    ],
    incoming: [
      { edgeType: "calls", confidence: "EXTRACTED", other: other("i1", "run") },
      { edgeType: "calls", confidence: "EXTRACTED", other: other("i2", "main") },
    ],
    notes: [{ noteId: "note-1", label: "Client design", type: "note" }],
    truncated: false,
  };
}

describe("code show", () => {
  beforeEach(() => {
    mockList.mockResolvedValue({ builds: [makeBuild({ name: "my-repo" })] });
  });

  it("shows a node by id", async () => {
    mockNode.mockResolvedValue(nodeDetail());
    const out = await codeShowAction.run({ target: "n1", limit: 10 }, ctx);
    expect(mockNode).toHaveBeenCalledWith("b1", "n1", "ws-1", { limit: 10 });
    expect(mockSearch).not.toHaveBeenCalled();
    expect(out.matchedBy).toBe("id");
    expect(out.node.id).toBe("n1");

    codeShowAction.renderHuman!(out);
    const text = logs.join("\n");
    expect(text).toContain("src/client.ts:L10");
    expect(text).toContain("10 | export function createClient() {");
    expect(text).toMatch(/Incoming[^\n]*\n {2}calls \(2\):\n {4}run/);
    expect(text).toMatch(/Outgoing[^\n]*\n {2}calls \(1\):\n {4}request[^\n]*\n {2}imports_from \(1\):/);
    expect(text).toContain("Client design [note]  note-1");
  });

  it("falls back to the top search hit on 404 and says so", async () => {
    mockNode.mockRejectedValueOnce(new Error("HTTP 404: not found")).mockResolvedValueOnce(nodeDetail("n9"));
    mockSearch.mockResolvedValue({ nodes: [{ id: "n9", label: "createClient" }] });
    const out = await codeShowAction.run({ target: "createClient" }, ctx);
    expect(mockSearch).toHaveBeenCalledWith("b1", "ws-1", { q: "createClient", limit: 1 });
    expect(mockNode).toHaveBeenLastCalledWith("b1", "n9", "ws-1", {});
    expect(out.matchedBy).toBe("search");
    codeShowAction.renderHuman!(out);
    expect(logs[0]).toBe('"createClient" is not a node id; showing the top search hit.');
  });

  it("rethrows non-404 errors and errors when search finds nothing", async () => {
    mockNode.mockRejectedValueOnce(new Error("HTTP 500: boom"));
    await expect(codeShowAction.run({ target: "x" }, ctx)).rejects.toThrow("HTTP 500: boom");
    mockNode.mockRejectedValueOnce(new Error("HTTP 404: nope"));
    mockSearch.mockResolvedValue({ nodes: [] });
    await expect(codeShowAction.run({ target: "x" }, ctx)).rejects.toThrow(/no search match/);
  });
});

describe("code impact", () => {
  const impactResult = {
    target: { file: "src/lib/a.ts" },
    dependents: [
      { id: "d1", label: "b", nodeType: "function", sourceFile: "src/b.ts", sourceLocation: "L1", distance: 1, via: "imports_from" },
    ],
    files: [{ sourceFile: "src/b.ts", minDistance: 1, count: 1 }],
    truncated: false,
  };

  beforeEach(() => {
    mockList.mockResolvedValue({ builds: [makeBuild({ name: "my-repo" })] });
    mockImpact.mockResolvedValue(impactResult);
  });

  it("sends an existing file as a repo-relative POSIX path", async () => {
    const out = await codeImpactAction.run({ target: join("src", "lib", "a.ts"), depth: 1, limit: 50 }, ctx);
    expect(mockImpact).toHaveBeenCalledWith("b1", "ws-1", { file: "src/lib/a.ts", depth: 1, limit: 50 });
    expect(mockSearch).not.toHaveBeenCalled();
    expect(out.matchedBy).toBe("file");

    codeImpactAction.renderHuman!(out);
    expect(logs[0]).toBe("1 dependent(s) of src/lib/a.ts in 1 file(s):");
    expect(logs[2]).toBe("     1      1  src/b.ts");
  });

  it("resolves relative to cwd in a subdirectory, and absolute paths", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(join(repo, "src"));
    await codeImpactAction.run({ target: join("lib", "a.ts") }, ctx);
    await codeImpactAction.run({ target: join(repo, "src", "lib", "a.ts") }, ctx);
    expect(mockImpact.mock.calls.map((c) => c[2])).toEqual([{ file: "src/lib/a.ts" }, { file: "src/lib/a.ts" }]);
  });

  it("uses the top search hit for a symbol", async () => {
    mockSearch.mockResolvedValue({ nodes: [{ id: "sym1", label: "createClient" }] });
    const node = { id: "sym1", label: "createClient()", nodeType: "function", sourceFile: "src/client.ts", sourceLocation: "L5" };
    mockImpact.mockResolvedValue({ ...impactResult, target: { node } });
    const out = await codeImpactAction.run({ target: "createClient" }, ctx);
    expect(mockImpact).toHaveBeenCalledWith("b1", "ws-1", { node: "sym1" });
    expect(out.matchedBy).toBe("search");
    codeImpactAction.renderHuman!(out);
    expect(logs[0]).toBe('"createClient" is not a file; using the top search hit createClient() (src/client.ts:L5).');
  });

  it("treats a file missing from the build as no dependents, not an error", async () => {
    mockImpact.mockRejectedValue(new Error('HTTP 404: {"error":"File not found in this build."}'));
    const out = await codeImpactAction.run({ target: join("src", "lib", "a.ts") }, ctx);
    expect(out).toMatchObject({
      target: { file: "src/lib/a.ts" }, dependents: [], files: [], truncated: false, notInGraph: true,
    });
    codeImpactAction.renderHuman!(out);
    expect(logs[0]).toMatch(/^src\/lib\/a\.ts is not in the graph yet/);
  });

  it("rethrows other impact errors", async () => {
    mockImpact.mockRejectedValue(new Error("HTTP 500: boom"));
    await expect(codeImpactAction.run({ target: join("src", "lib", "a.ts") }, ctx)).rejects.toThrow("HTTP 500");
  });

  it("rejects files outside the repo and unknown symbols", async () => {
    writeFileSync(join(tmp, "outside.ts"), "x\n");
    await expect(codeImpactAction.run({ target: join(tmp, "outside.ts") }, ctx)).rejects.toThrow(/outside the repo/);
    mockSearch.mockResolvedValue({ nodes: [] });
    await expect(codeImpactAction.run({ target: "nothing" }, ctx)).rejects.toThrow(/matches no symbol/);
  });
});

describe("toRepoRelative / findGraphify", () => {
  it("maps paths to repo-relative POSIX or null", () => {
    expect(toRepoRelative(join("src", "lib", "a.ts"), repo, repo)).toBe("src/lib/a.ts");
    expect(toRepoRelative(join(tmp, "x.ts"), repo, repo)).toBeNull();
    expect(toRepoRelative(".", repo, repo)).toBeNull();
  });

  it("finds graphify on PATH, then in the uv tool dir", async () => {
    const { findGraphify } = await vi.importActual<typeof import("../code/shared")>("../code/shared");
    const exe = isWin ? "graphify.exe" : "graphify";
    const bin = join(tmp, "bin");
    mkdirSync(bin);
    writeFileSync(join(bin, exe), "");
    chmodSync(join(bin, exe), 0o755);
    expect(findGraphify({ PATH: `${join(tmp, "nope")}${delimiter}${bin}`, HOME: tmp, USERPROFILE: tmp })).toBe(join(bin, exe));

    expect(findGraphify({ PATH: "", HOME: tmp, USERPROFILE: tmp })).toBeNull();
    const uvDir = join(tmp, ".local", "share", "uv", "tools", "graphifyy", "bin");
    mkdirSync(uvDir, { recursive: true });
    writeFileSync(join(uvDir, exe), "");
    chmodSync(join(uvDir, exe), 0o755);
    expect(findGraphify({ PATH: "", HOME: tmp, USERPROFILE: tmp })).toBe(join(uvDir, exe));
  });
});

describe("code refresh", () => {
  function noGraphify(): void {
    vi.mocked(shared.findGraphify).mockReturnValue(null);
  }

  it("--if-stale never creates a first build", async () => {
    noGraphify();
    const out = await codeRefreshAction.run({ ifStale: true }, ctx);
    expect(out).toMatchObject({ refreshed: false, reason: "no-build", build: null });
    expect(mockImport).not.toHaveBeenCalled();
  });

  it("--if-stale skips an up-to-date build", async () => {
    noGraphify();
    mockList.mockResolvedValue({ builds: [makeBuild({ name: "my-repo", commitSha: head })] });
    const out = await codeRefreshAction.run({ ifStale: true }, ctx);
    expect(out).toMatchObject({ refreshed: false, reason: "up-to-date", before: { behind: 0, head, stale: false } });
  });

  it("errors with the install hint when graphify is missing", async () => {
    noGraphify();
    await expect(codeRefreshAction.run({}, ctx)).rejects.toThrow(/uv tool install graphifyy==0\.9\.97/);
  });

  describe.skipIf(isWin)("with a fake graphify", () => {
    let logFile: string;

    beforeEach(() => {
      const bin = join(tmp, "fake-bin");
      mkdirSync(bin);
      logFile = join(tmp, "graphify-args.json");
      const script = `#!/usr/bin/env node
const fs = require("fs"), path = require("path");
const args = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(logFile)}, JSON.stringify({ args, cwd: process.cwd() }));
if (process.env.FAKE_GRAPHIFY_FAIL) { process.stderr.write("boom\\n"); process.exit(3); }
const out = path.join(args[args.indexOf("--out") + 1], "graphify-out");
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(${JSON.stringify(FIXTURE)}, path.join(out, "graph.json"));
`;
      writeFileSync(join(bin, "graphify"), script);
      chmodSync(join(bin, "graphify"), 0o755);
      process.env.PATH = `${bin}${delimiter}${savedEnv.PATH ?? ""}`;
      mockImport.mockResolvedValue({ ...makeBuild({ name: "my-repo", commitSha: head }), replaced: true });
    });

    it("extracts the repo root and imports with name, root, commit and replace", async () => {
      mockList.mockResolvedValue({ builds: [makeBuild({ name: "my-repo", commitSha: "deadbee" })] });
      vi.spyOn(process, "cwd").mockReturnValue(join(repo, "src"));
      const out = await codeRefreshAction.run({ ifStale: true, exclude: ["vendor/**", "dist/**"] }, ctx);

      const { args, cwd } = JSON.parse(readFileSync(logFile, "utf8")) as { args: string[]; cwd: string };
      const outDir = args[args.indexOf("--out") + 1];
      expect(args).toEqual(["extract", ".", "--code-only", "--out", outDir, "--exclude", "vendor/**", "--exclude", "dist/**"]);
      expect(realpathSync.native(cwd)).toBe(realpathSync.native(repo));
      expect(existsSync(outDir)).toBe(false); // temp dir cleaned up

      const body = mockImport.mock.calls[0][0] as Record<string, unknown>;
      expect(body).toMatchObject({ workspaceId: "ws-1", name: "my-repo", commitSha: head, replace: true });
      expect(realpathSync.native(body.rootPath as string)).toBe(realpathSync.native(repo));
      expect((body.graph as { nodes: unknown[] }).nodes).toHaveLength(40);
      expect(out.refreshed).toBe(true);
      expect(out.before.stale).toBe(true);

      codeRefreshAction.renderHuman!(out);
      expect(logs[0]).toBe(`Refreshed "my-repo" at ${head}: 40 nodes, 146 edges, 17 communities.`);
    });

    it("keeps the existing build's name when --build picks it", async () => {
      mockList.mockResolvedValue({ builds: [makeBuild({ id: "custom", name: "custom-name" })] });
      await codeRefreshAction.run({ build: "custom" }, ctx);
      expect((mockImport.mock.calls[0][0] as { name: string }).name).toBe("custom-name");
    });

    it("surfaces graphify's exit code and output on failure", async () => {
      process.env.FAKE_GRAPHIFY_FAIL = "1";
      await expect(codeRefreshAction.run({}, ctx)).rejects.toThrow(/exit 3\)\.\nboom/);
      expect(mockImport).not.toHaveBeenCalled();
    });
  });
});
