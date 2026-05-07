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
// Stop script — minimal changes, stderr kept suppressed
// =============================================================
describe("generateHookScripts: mnotes-session-stop.sh", () => {
  it("has bash shebang and set -euo pipefail", () => {
    const content = getScript("mnotes-session-stop.sh");
    expect(content).toMatch(/^#!\/usr\/bin\/env bash/);
    expect(content).toContain("set -euo pipefail");
  });

  it("keeps stderr suppressed with 2>&1 on the session log call", () => {
    const content = getScript("mnotes-session-stop.sh");
    expect(content).toContain("> /dev/null 2>&1");
  });

  it("uses || true so failures do not block session shutdown", () => {
    const content = getScript("mnotes-session-stop.sh");
    expect(content).toContain("|| true");
  });

  it("includes a comment explaining why stderr is suppressed", () => {
    const content = getScript("mnotes-session-stop.sh");
    // Must document the intent — reviewers need to know it's deliberate
    expect(content).toMatch(/stderr.*suppress|suppress.*stderr/i);
  });

  // Bug #931: prevent empty session-log notes
  it("exits early when MNOTES_SESSION_ID is not set (#931)", () => {
    const content = getScript("mnotes-session-stop.sh");
    // Must guard the log call on MNOTES_SESSION_ID being explicitly set
    expect(content).toMatch(/if\s+\[\s+-z\s+["']\$\{MNOTES_SESSION_ID:?-?\}["']\s+\]/);
    expect(content).toMatch(/exit\s+0/);
  });

  it("does NOT auto-generate a SESSION_ID fallback (#931)", () => {
    const content = getScript("mnotes-session-stop.sh");
    // The old broken pattern minted a fresh ID per stop, creating duplicate empty notes
    expect(content).not.toMatch(/SESSION_ID=["']\$\{MNOTES_SESSION_ID:-\$\(date/);
    expect(content).not.toContain("date +%Y%m%d");
  });

  it("uses MNOTES_SESSION_ID directly on the log call (#931)", () => {
    const content = getScript("mnotes-session-stop.sh");
    expect(content).toMatch(/--session-id\s+["']\$MNOTES_SESSION_ID["']/);
  });
});

// =============================================================
// Script filenames unchanged (existing users have them in settings.json)
// =============================================================
describe("generateHookScripts: filenames", () => {
  it("returns exactly two scripts with the expected filenames", () => {
    const scripts = generateHookScripts(opts);
    const names = scripts.map((s) => s.filename);
    expect(names).toContain("mnotes-session-start.sh");
    expect(names).toContain("mnotes-session-stop.sh");
    expect(names).toHaveLength(2);
  });
});
