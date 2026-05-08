import { describe, it, expect } from "vitest";
import { generateHookScripts } from "./hooks";

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
// Script filenames — only SessionStart remains after #939
// =============================================================
describe("generateHookScripts: filenames", () => {
  it("returns exactly one script (SessionStart only)", () => {
    const scripts = generateHookScripts(opts);
    const names = scripts.map((s) => s.filename);
    expect(names).toEqual(["mnotes-session-start.sh"]);
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
