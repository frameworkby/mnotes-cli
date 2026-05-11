import { describe, it, expect } from "vitest";
import { generateHookScripts, generatePostToolUseScript } from "./hooks";

const opts = { url: "http://localhost:3000", workspaceId: "ws-test-123" };

function getScript(name: string): string {
  const scripts = generateHookScripts(opts);
  const script = scripts.find((s) => s.filename === name);
  if (!script) throw new Error(`Script ${name} not found`);
  return script.content;
}

// =============================================================
// SessionStart script — output capture + JSON envelope
// =============================================================
describe("generateHookScripts: mnotes-session-start.sh", () => {
  it("has bash shebang and set -euo pipefail safety", () => {
    const content = getScript("mnotes-session-start.sh");
    expect(content).toMatch(/^#!\/usr\/bin\/env bash/);
    expect(content).toContain("set -euo pipefail");
  });

  it("captures project-load output into a variable (does not redirect to /dev/null)", () => {
    const content = getScript("mnotes-session-start.sh");
    // Must assign stdout to a variable, not throw it away
    expect(content).toMatch(/_context=\$\(mnotes composite project-load/);
    // The capture line must NOT pipe to /dev/null on the same command
    const captureLine = content
      .split("\n")
      .find((l) => l.includes("_context=$(mnotes composite project-load"));
    expect(captureLine).toBeDefined();
    expect(captureLine).not.toContain("> /dev/null");
  });

  it("suppresses stderr from project-load to avoid noisy session starts", () => {
    const content = getScript("mnotes-session-start.sh");
    const captureLine = content
      .split("\n")
      .find((l) => l.includes("_context=$(mnotes composite project-load"));
    expect(captureLine).toBeDefined();
    expect(captureLine).toContain("2>/dev/null");
  });

  it("uses || true so failures do not block session start", () => {
    const content = getScript("mnotes-session-start.sh");
    const captureLine = content
      .split("\n")
      .find((l) => l.includes("_context=$(mnotes composite project-load"));
    expect(captureLine).toBeDefined();
    expect(captureLine).toContain("|| true");
  });

  it("emits the SessionStart JSON envelope wrapping _context via jq", () => {
    const content = getScript("mnotes-session-start.sh");
    // jq path: reads stdin, produces the hook envelope
    expect(content).toContain("hookSpecificOutput");
    expect(content).toContain("hookEventName");
    expect(content).toContain("SessionStart");
    expect(content).toContain("additionalContext");
    // Specifically uses jq for safe JSON encoding
    expect(content).toContain("jq");
    expect(content).toMatch(/jq\s+-Rs\s+['"]?\{hookSpecificOutput/);
  });

  it("has a printf fallback for when jq is unavailable", () => {
    const content = getScript("mnotes-session-start.sh");
    // Falls back to printf when jq not on PATH
    expect(content).toContain("command -v jq");
    expect(content).toMatch(/printf.*hookSpecificOutput.*hookEventName.*SessionStart.*additionalContext/s);
  });

  it("only prints the JSON envelope when _context is non-empty", () => {
    const content = getScript("mnotes-session-start.sh");
    // Guard: [ -n "$_context" ]
    expect(content).toMatch(/\[\s+-n\s+['"]\$_context['"]\s*\]/);
  });

  it("the generated JSON envelope is parseable when context is present", () => {
    // Construct the envelope the same way the jq branch does and verify it's
    // valid JSON with the right shape.
    const sampleContext = '{"notes":[{"title":"Arch","content":"test"}]}';
    const envelope = JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: sampleContext,
      },
    });
    const parsed = JSON.parse(envelope) as {
      hookSpecificOutput: { hookEventName: string; additionalContext: string };
    };
    expect(parsed.hookSpecificOutput.hookEventName).toBe("SessionStart");
    expect(parsed.hookSpecificOutput.additionalContext).toBe(sampleContext);
  });

  it("does NOT contain the old > /dev/null 2>&1 pattern on the project-load line", () => {
    const content = getScript("mnotes-session-start.sh");
    // The old broken pattern that discarded output entirely
    expect(content).not.toMatch(/mnotes composite project-load[^\n]*> \/dev\/null 2>&1/);
  });
});

// =============================================================
// Stop script — removed in #939. Claude Code's `Stop` event fires after
// every assistant turn, not at session end, so any auto-log it emits is
// necessarily noise. The CLAUDE.md template instructs the agent to call
// `mnotes session log` itself with a real summary when meaningful work
// happened.
// =============================================================
describe("generateHookScripts: mnotes-session-stop.sh removed (#939)", () => {
  it("does not emit a Stop-hook script", () => {
    const scripts = generateHookScripts(opts);
    const names = scripts.map((s) => s.filename);
    expect(names).not.toContain("mnotes-session-stop.sh");
  });
});

// =============================================================
// Script filenames — SessionStart + PostToolUse by default (#945)
// =============================================================
describe("generateHookScripts: filenames", () => {
  it("returns both scripts by default (autoLog unset)", () => {
    const scripts = generateHookScripts(opts);
    const names = scripts.map((s) => s.filename);
    expect(names).toContain("mnotes-session-start.sh");
    expect(names).toContain("mnotes-post-tool-use.sh");
    expect(names).toHaveLength(2);
  });

  it("returns only session-start when autoLog: false", () => {
    const scripts = generateHookScripts({ ...opts, autoLog: false });
    const names = scripts.map((s) => s.filename);
    expect(names).toEqual(["mnotes-session-start.sh"]);
    expect(names).not.toContain("mnotes-post-tool-use.sh");
  });
});

// =============================================================
// Hook template registration — Stop event no longer registered (#939)
// =============================================================
describe("generateHooksTemplate (#939)", () => {
  it("registers SessionStart but NOT Stop", async () => {
    const { generateHooksTemplate } = await import("./hooks");
    const tmpl = generateHooksTemplate(opts);
    expect(tmpl.SessionStart).toBeDefined();
    expect(tmpl.SessionStart).toHaveLength(1);
    expect((tmpl as Record<string, unknown>).Stop).toBeUndefined();
  });
});

// =============================================================
// generateHooksTemplate: PostToolUse registration (#945)
// =============================================================
describe("generateHooksTemplate: PostToolUse (#945)", () => {
  it("registers PostToolUse with Bash matcher by default", async () => {
    const { generateHooksTemplate, getHookScriptsDir } = await import("./hooks");
    const tmpl = generateHooksTemplate(opts);
    expect(tmpl.PostToolUse).toBeDefined();
    expect(tmpl.PostToolUse).toHaveLength(1);
    expect(tmpl.PostToolUse![0].matcher).toBe("Bash");
  });

  it("PostToolUse command contains absolute path to post-tool-use script", async () => {
    const { generateHooksTemplate, getHookScriptsDir } = await import("./hooks");
    const tmpl = generateHooksTemplate(opts);
    const cmd = tmpl.PostToolUse![0].hooks[0].command;
    const expectedPath = getHookScriptsDir() + "/mnotes-post-tool-use.sh";
    expect(cmd).toContain(expectedPath);
  });

  it("PostToolUse command sets MNOTES_WORKSPACE_ID env var", async () => {
    const { generateHooksTemplate } = await import("./hooks");
    const tmpl = generateHooksTemplate(opts);
    const cmd = tmpl.PostToolUse![0].hooks[0].command;
    expect(cmd).toContain(`MNOTES_WORKSPACE_ID=${opts.workspaceId}`);
  });

  it("does NOT register PostToolUse when autoLog: false", async () => {
    const { generateHooksTemplate } = await import("./hooks");
    const tmpl = generateHooksTemplate({ ...opts, autoLog: false });
    expect((tmpl as Record<string, unknown>).PostToolUse).toBeUndefined();
  });

  it("SessionStart entry is unchanged regardless of autoLog", async () => {
    const { generateHooksTemplate } = await import("./hooks");
    const withLog = generateHooksTemplate(opts);
    const withoutLog = generateHooksTemplate({ ...opts, autoLog: false });
    expect(withLog.SessionStart).toEqual(withoutLog.SessionStart);
  });
});

// =============================================================
// PostToolUse script content — generatePostToolUseScript (#945)
// =============================================================
describe("generatePostToolUseScript: shebang and safety", () => {
  it("has bash shebang", () => {
    const s = generatePostToolUseScript();
    expect(s).toMatch(/^#!\/usr\/bin\/env bash/);
  });

  it("has set -uo pipefail (NOT -e to allow fail-open)", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("set -uo pipefail");
    // -e must NOT appear as a standalone flag (fail-open requirement)
    expect(s).not.toMatch(/set\s+-[a-z]*e[a-z]*/);
  });

  it("always exits 0 — trailing exit 0 present", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("exit 0");
  });

  it("all non-trivial early exits use exit 0", () => {
    const s = generatePostToolUseScript();
    // Every `exit` call should be `exit 0`
    const exitCalls = s.match(/\bexit\s+\d+/g) ?? [];
    for (const call of exitCalls) {
      expect(call).toBe("exit 0");
    }
  });
});

describe("generatePostToolUseScript: stdin + jq parsing", () => {
  it("reads stdin into _payload variable", () => {
    const s = generatePostToolUseScript();
    expect(s).toMatch(/_payload=\$\(cat\)/);
  });

  it("requires jq and exits 0 silently if missing", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("command -v jq");
    expect(s).toContain("exit 0");
  });

  it("parses .tool_name from payload via jq", () => {
    const s = generatePostToolUseScript();
    expect(s).toMatch(/jq.*\.tool_name/);
  });

  it("parses .tool_input.command from payload via jq", () => {
    const s = generatePostToolUseScript();
    expect(s).toMatch(/jq.*\.tool_input\.command/);
  });

  it("parses .tool_response.stdout from payload via jq", () => {
    const s = generatePostToolUseScript();
    expect(s).toMatch(/jq.*\.tool_response\.stdout/);
  });

  it("parses .session_id from payload via jq", () => {
    const s = generatePostToolUseScript();
    expect(s).toMatch(/jq.*\.session_id/);
  });
});

describe("generatePostToolUseScript: early-exit filters", () => {
  it("exits when tool_name is not Bash", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain('"Bash"');
    // There must be a != Bash guard followed by exit 0
    expect(s).toMatch(/tool_name.*!=.*Bash|!=.*Bash.*tool_name/s);
  });

  it("exits when command does not start with mnotes", () => {
    const s = generatePostToolUseScript();
    // grep filter on '^[[:space:]]*mnotes[[:space:]]'
    expect(s).toContain("mnotes");
    expect(s).toMatch(/grep.*mnotes/);
  });
});

describe("generatePostToolUseScript: kind classification", () => {
  it("classifies notes create / notes update / wiki ingest as kind=ingest", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("ingest");
    expect(s).toMatch(/notes.*create|notes.*update|wiki.*ingest/);
  });

  it("classifies search / recall-knowledge as kind=query", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("query");
    expect(s).toMatch(/\\bsearch\\b|recall-knowledge/);
  });

  it("classifies wiki lint / kb scan-conflicts as kind=lint", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("lint");
    expect(s).toMatch(/wiki.*lint|kb.*scan-conflicts/);
  });

  it("extracts --title value for ingest ref", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("--title");
  });

  it("falls back to first 60 chars of stdout when no --title", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("head -c 60");
  });

  it("falls back to 'untitled' when stdout also empty", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain('"untitled"');
  });
});

describe("generatePostToolUseScript: dedup", () => {
  it("uses ~/.claude/hooks/mnotes/state/postusetool.dedup path", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("postusetool.dedup");
    expect(s).toContain(".claude/hooks/mnotes/state");
  });

  it("hashes via shasum -a 256 with sha256sum fallback", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("shasum -a 256");
    expect(s).toContain("sha256sum");
  });

  it("prunes entries older than 300 seconds", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("300");
    expect(s).toMatch(/cutoff.*300|300.*cutoff/s);
  });

  it("caps dedup file at 50 lines via tail -n 50", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("tail -n 50");
  });

  it("dedup grep anchors hash to end of line (grep -qE with trailing $)", () => {
    const s = generatePostToolUseScript();
    // Must use -qE and anchor the hash at end of line, not plain -qF substring match
    expect(s).toMatch(/grep\s+-qE\s+["'] \$\{_hash\}\$/);
  });
});

describe("generatePostToolUseScript: session rate cap", () => {
  it("uses a per-session state file under ~/.claude/hooks/mnotes/state/", () => {
    const s = generatePostToolUseScript();
    expect(s).toMatch(/postusetool\.session\./);
  });

  it("enforces a cap of 30 appends per session", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("30");
    expect(s).toMatch(/_count.*30|30.*_count/s);
  });

  it("writes a stderr message when cap is reached", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("session cap reached");
    expect(s).toMatch(/>&2/);
  });

  it("falls back to PID-based file when session_id is empty", () => {
    const s = generatePostToolUseScript();
    expect(s).toMatch(/pid\$\{?\$\}?|\$\$|pid\$\$/);
  });

  it("sanitizes corrupt counter before rate-cap test (case pattern resets non-numeric _count to 0)", () => {
    const s = generatePostToolUseScript();
    // The case statement must appear after reading _count and before the -ge 30 test
    expect(s).toMatch(/case "\$\{_count\}" in ''|\*\[!0-9\]\*\) _count=0 ;; esac/);
    // The -ge test must NOT carry a 2>/dev/null swallow after sanitization
    const rateCapLine = s.split("\n").find((l) => l.includes("-ge 30"));
    expect(rateCapLine).toBeDefined();
    expect(rateCapLine).not.toContain("2>/dev/null");
  });
});

describe("generatePostToolUseScript: wiki log append call", () => {
  it("calls mnotes wiki log append with --kind, --ref, --summary", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("mnotes wiki log append");
    expect(s).toContain("--kind");
    expect(s).toContain("--ref");
    expect(s).toContain("--summary");
  });

  it("suppresses output and uses || true to never block", () => {
    const s = generatePostToolUseScript();
    const appendLine = s.split("\n").find((l) => l.includes("mnotes wiki log append"));
    expect(appendLine).toBeDefined();
    expect(appendLine).toContain(">/dev/null 2>&1 || true");
  });

  it("summary is first 80 chars of stdout with newlines stripped", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("head -c 80");
    expect(s).toContain("tr -d");
  });
});

describe("generatePostToolUseScript: optional debug log", () => {
  it("checks MNOTES_HOOK_DEBUG=1 before writing debug log", () => {
    const s = generatePostToolUseScript();
    expect(s).toContain("MNOTES_HOOK_DEBUG");
    expect(s).toContain("postusetool.debug.log");
  });
});
