import type { Command } from "commander";
import type { ActionDescriptor } from "../_register-group";
import type { GraphBuildRecord, GraphBuildStats } from "../../client";
import { BUILD_OPTION, codeEnv, findBuild, git } from "./shared";
import type { CodeEnv } from "./shared";

export interface CodeStatusInput {
  build?: string;
}

export interface CodeStatus {
  build: {
    id: string;
    name: string;
    commitSha: string | null;
    createdAt: string;
    stats: GraphBuildStats;
  } | null;
  /** git top-level, or null outside a git repo. */
  repoRoot: string | null;
  /** Short HEAD sha, or null outside a git repo / before the first commit. */
  head: string | null;
  /** Commits between the build's commitSha and HEAD; null when the sha is unknown locally. */
  behind: number | null;
  /** HEAD moved past the build's commit, or that commit is unknown locally. */
  stale: boolean;
  /** Tracked files have uncommitted changes (not part of `stale`). */
  dirty: boolean;
}

/**
 * Compare a build against the local checkout. Stale means: the build exists,
 * we're in a git repo, and HEAD moved past the build's commit (or that commit
 * is unknown locally). Uncommitted changes are reported as `dirty` only, so
 * `refresh --if-stale` doesn't re-extract on every trigger while editing.
 */
export function computeStatus(build: GraphBuildRecord | null, env: Pick<CodeEnv, "repoRoot">): CodeStatus {
  const root = env.repoRoot;
  const head = root ? git(["rev-parse", "--short", "HEAD"], root) : null;
  let behind: number | null = null;
  if (root && build?.commitSha) {
    // `--end-of-options`-style guard: a sha never starts with "-", but refuse anything that does.
    const sha = build.commitSha;
    const out = sha.startsWith("-") ? null : git(["rev-list", "--count", `${sha}..HEAD`], root);
    behind = out !== null && /^\d+$/.test(out) ? Number(out) : null;
  }
  const dirty = root ? (git(["status", "--porcelain", "--untracked-files=no"], root) ?? "") !== "" : false;
  const stale = Boolean(build && root && (behind === null || behind >= 1));
  return {
    build: build
      ? { id: build.id, name: build.name, commitSha: build.commitSha, createdAt: build.createdAt, stats: build.stats }
      : null,
    repoRoot: root,
    head,
    behind,
    stale,
    dirty,
  };
}

export const codeStatusAction: ActionDescriptor<CodeStatusInput, CodeStatus> = {
  name: "status",
  describe: "Show the code graph build for this repo and whether it is stale.",
  mcpTool: "get_code_graph_status",
  args: (cmd: Command) => cmd.option(...BUILD_OPTION),

  run: async (input, ctx) => {
    const env = codeEnv(ctx);
    const build = await findBuild(env, input.build);
    return computeStatus(build, env);
  },

  renderHuman: (s) => {
    if (!s.build) {
      console.log("No code graph build for this repo.");
      console.log("Build one with /mnotes:graphify (Claude Code) or `mnotes code refresh`.");
      return;
    }
    const b = s.build;
    console.log(
      `Build: ${b.name} (${b.id}) at ${b.commitSha ?? "unknown commit"}, ${b.stats.nodes} nodes / ${b.stats.edges} edges, built ${b.createdAt}`,
    );
    if (!s.repoRoot) {
      console.log("Not in a git repo; staleness unknown.");
      return;
    }
    const behind = s.behind === null ? "build commit unknown locally" : `${s.behind} commit(s) behind`;
    console.log(`Repo: ${s.repoRoot} at ${s.head ?? "no commits"} (${behind}${s.dirty ? ", uncommitted changes" : ""})`);
    console.log(s.stale ? "Stale. Run `mnotes code refresh`." : "Up to date.");
  },
};
