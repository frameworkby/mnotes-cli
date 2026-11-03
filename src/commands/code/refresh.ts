import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Command } from "commander";
import type { ActionDescriptor } from "../_register-group";
import type { GraphBuildRecord } from "../../client";
import { importGraphAction } from "../graph/import";
import { BUILD_OPTION, GRAPHIFY_INSTALL_HINT, codeEnv, defaultBuildName, findBuild, findGraphify } from "./shared";
import { computeStatus } from "./status";
import type { CodeStatus } from "./status";

export interface CodeRefreshInput {
  ifStale?: boolean;
  exclude?: string[];
  build?: string;
}

export interface CodeRefreshResult {
  refreshed: boolean;
  /** Why nothing was done (only when refreshed is false). */
  reason?: "up-to-date" | "no-build";
  /** Status before the refresh. */
  before: CodeStatus;
  /** The imported build (only when refreshed is true). */
  build: (GraphBuildRecord & { replaced: boolean }) | null;
}

function collect(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}

/** Run graphify without a shell; graphify's own output goes to stderr unless quiet. */
export function runGraphify(bin: string, args: string[], cwd: string, quiet: boolean): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(bin, args, { cwd, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let tail = "";
    const onData = (chunk: Buffer) => {
      if (!quiet) process.stderr.write(chunk);
      tail = (tail + chunk.toString("utf8")).slice(-4000);
    };
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    child.on("error", (err) => reject(new Error(`Could not run graphify (${bin}): ${err.message}`)));
    child.on("close", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`graphify extract failed (exit ${code}).\n${tail.trim()}`));
    });
  });
}

export const codeRefreshAction: ActionDescriptor<CodeRefreshInput, CodeRefreshResult> = {
  name: "refresh",
  describe: "Re-extract this repo with graphify and replace its code graph build.",
  mcpTool: "refresh_code_graph",
  args: (cmd: Command) =>
    cmd
      .option("--if-stale", "Do nothing unless `mnotes code status` reports the build stale (never creates a first build)")
      .option("--exclude <glob>", "Glob for graphify to skip (repeatable)", collect)
      .option(...BUILD_OPTION),

  run: async (input, ctx) => {
    const env = codeEnv(ctx);
    const existing = await findBuild(env, input.build);
    const before = computeStatus(existing, env);

    if (input.ifStale) {
      // --if-stale runs from hooks, so it never uploads a repo that has no build yet.
      if (!existing) return { refreshed: false, reason: "no-build", before, build: null };
      if (!before.stale) return { refreshed: false, reason: "up-to-date", before, build: null };
    }

    const bin = findGraphify();
    if (!bin) {
      throw new Error(`graphify is not installed. Install it with: ${GRAPHIFY_INSTALL_HINT}`);
    }

    const root = env.repoRoot ?? env.cwd;
    const name = existing?.name ?? defaultBuildName(env);
    const out = mkdtempSync(join(tmpdir(), "mnotes-graphify-"));
    try {
      const args = ["extract", ".", "--code-only", "--out", out];
      for (const glob of input.exclude ?? []) args.push("--exclude", glob);
      await runGraphify(bin, args, root, ctx.json);

      const build = await importGraphAction.run(
        {
          file: join(out, "graphify-out", "graph.json"),
          name,
          root,
          ...(before.head ? { commit: before.head } : {}),
          replace: true,
        },
        ctx,
      );
      return { refreshed: true, before, build };
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  },

  renderHuman: (out) => {
    if (!out.refreshed) {
      console.log(
        out.reason === "no-build"
          ? "No code graph build for this repo; --if-stale never creates one. Run `mnotes code refresh`."
          : "Code graph is up to date.",
      );
      return;
    }
    const b = out.build!;
    console.log(
      `${b.replaced ? "Refreshed" : "Created"} "${b.name}" at ${b.commitSha ?? "unknown commit"}: ${b.stats.nodes} nodes, ${b.stats.edges} edges, ${b.stats.communities} communities.`,
    );
  },
};
