import { spawnSync } from "node:child_process";
import { InvalidArgumentError } from "commander";
import { accessSync, constants, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, delimiter, isAbsolute, join, relative, resolve, sep } from "node:path";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { GraphBuildRecord } from "../../client";
import type { ActionContext } from "../_register-group";

export type CodeClient = ReturnType<typeof createClient>;

export const GRAPHIFY_INSTALL_HINT = "uv tool install graphifyy==0.9.97";

/** Shared `--build` option text. */
export const BUILD_OPTION: [string, string] = [
  "--build <name|id>",
  "Graph build name or id (default: MNOTES_CODE_BUILD, then the build named after the repo)",
];

/** Commander parser for positive integer options. */
export function positiveInt(value: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new InvalidArgumentError("Expected a positive integer.");
  return n;
}

/** Run git without a shell. Returns trimmed stdout, or null when git fails or is missing. */
export function git(args: string[], cwd: string): string | null {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", shell: false, windowsHide: true });
  if (r.error || r.status !== 0) return null;
  return r.stdout.trim();
}

/** Repo top-level (git's spelling, forward slashes on Windows), or null outside a repo. */
export function repoRootOf(cwd: string): string | null {
  return git(["rev-parse", "--show-toplevel"], cwd) || null;
}

function realpath(p: string): string {
  try {
    // .native expands Windows 8.3 short names (RUNNER~1) so both sides compare equal.
    return realpathSync.native(p);
  } catch {
    return resolve(p);
  }
}

/**
 * Convert `p` (absolute or relative to `cwd`) into a repo-relative POSIX path.
 * Returns null when it resolves outside `root`.
 */
export function toRepoRelative(p: string, root: string, cwd: string): string | null {
  const abs = realpath(resolve(cwd, p));
  const rel = relative(realpath(root), abs);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return null;
  return rel.split(sep).join("/");
}

export function isFile(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function isExecutable(p: string): boolean {
  if (!isFile(p)) return false;
  if (process.platform === "win32") return true;
  try {
    accessSync(p, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Locate the graphify binary: PATH first, then uv's tool dir. On Windows only
 * `graphify.exe` is accepted because it is spawned with shell:false (.cmd shims
 * can't be).
 */
export function findGraphify(env: NodeJS.ProcessEnv = process.env): string | null {
  const win = process.platform === "win32";
  const exe = win ? "graphify.exe" : "graphify";
  const pathVar = env.PATH ?? env.Path ?? "";
  for (const dir of pathVar.split(delimiter)) {
    if (!dir) continue;
    const candidate = join(dir, exe);
    if (isExecutable(candidate)) return candidate;
  }
  const home = env.HOME || env.USERPROFILE || homedir();
  const fallbacks = [join(home, ".local", "share", "uv", "tools", "graphifyy", "bin", exe)];
  if (win) {
    if (env.APPDATA) fallbacks.push(join(env.APPDATA, "uv", "tools", "graphifyy", "Scripts", exe));
    fallbacks.push(join(home, ".local", "share", "uv", "tools", "graphifyy", "Scripts", exe));
  }
  return fallbacks.find(isExecutable) ?? null;
}

export interface CodeEnv {
  client: CodeClient;
  workspaceId: string;
  cwd: string;
  /** git top-level, or null outside a repo. */
  repoRoot: string | null;
}

export function codeEnv(ctx: ActionContext): CodeEnv {
  const config = resolveConfig(ctx.globalOpts);
  const workspaceId = config.workspaceId;
  if (!workspaceId) {
    throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
  }
  const cwd = process.cwd();
  return {
    client: createClient(config.baseUrl, config.apiKey),
    workspaceId,
    cwd,
    repoRoot: repoRootOf(cwd),
  };
}

/** Name the default build is looked up by: basename of the repo root, or of cwd. */
export function defaultBuildName(env: Pick<CodeEnv, "cwd" | "repoRoot">): string {
  return basename(resolve(env.repoRoot ?? env.cwd));
}

/** The explicit build reference: --build, then MNOTES_CODE_BUILD. */
export function explicitBuildRef(build?: string): string | undefined {
  return build || process.env.MNOTES_CODE_BUILD || undefined;
}

/**
 * Resolve the build: `--build <name|id>` > MNOTES_CODE_BUILD > the build
 * named after the repo. A ref is matched as a name first, then as an id.
 * Returns null when nothing matches.
 */
export async function findBuild(env: CodeEnv, buildRef?: string): Promise<GraphBuildRecord | null> {
  const ref = explicitBuildRef(buildRef);
  const name = ref ?? defaultBuildName(env);
  // Names are unique per workspace; `?name=` filters server-side. Filter here too
  // in case an older server ignores the parameter.
  const { builds } = await env.client.listGraphBuilds(env.workspaceId, { name });
  const named = builds
    .filter((b) => b.name === name)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  if (named[0] || !ref) return named[0] ?? null;
  // Not a name: try it as a build id.
  const all = await env.client.listGraphBuilds(env.workspaceId);
  return all.builds.find((b) => b.id === ref) ?? null;
}

export async function requireBuild(env: CodeEnv, buildRef?: string): Promise<GraphBuildRecord> {
  const build = await findBuild(env, buildRef);
  if (build) return build;
  const ref = explicitBuildRef(buildRef);
  if (ref) {
    throw new Error(
      `No graph build with id or name "${ref}" (from ${buildRef ? "--build" : "MNOTES_CODE_BUILD"}). List builds with \`mnotes graph builds\`.`,
    );
  }
  throw new Error(
    `No code graph build named "${defaultBuildName(env)}". Build one with /mnotes:graphify (Claude Code) or \`mnotes code refresh\`.`,
  );
}

/** True when an API error is a 404. */
export function isNotFound(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith("HTTP 404");
}

export function loc(n: { sourceFile: string | null; sourceLocation: string | null }): string {
  if (!n.sourceFile) return "";
  return n.sourceLocation ? `${n.sourceFile}:${n.sourceLocation}` : n.sourceFile;
}

export function buildSummary(b: GraphBuildRecord): { id: string; name: string; commitSha: string | null } {
  return { id: b.id, name: b.name, commitSha: b.commitSha };
}
