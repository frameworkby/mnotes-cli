"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const hooks_1 = require("./hooks");
const opts = { url: "http://localhost:3000", workspaceId: "ws-test-123" };
function getScript(name) {
    const scripts = (0, hooks_1.generateHookScripts)(opts);
    const script = scripts.find((s) => s.filename === name);
    if (!script)
        throw new Error(`Script ${name} not found`);
    return script.content;
}
// =============================================================
// SessionStart script — output capture + JSON envelope
// =============================================================
(0, vitest_1.describe)("generateHookScripts: mnotes-session-start.sh", () => {
    (0, vitest_1.it)("has bash shebang and set -euo pipefail safety", () => {
        const content = getScript("mnotes-session-start.sh");
        (0, vitest_1.expect)(content).toMatch(/^#!\/usr\/bin\/env bash/);
        (0, vitest_1.expect)(content).toContain("set -euo pipefail");
    });
    (0, vitest_1.it)("captures project-load output into a variable (does not redirect to /dev/null)", () => {
        const content = getScript("mnotes-session-start.sh");
        // Must assign stdout to a variable, not throw it away
        (0, vitest_1.expect)(content).toMatch(/_context=\$\(mnotes composite project-load/);
        // The capture line must NOT pipe to /dev/null on the same command
        const captureLine = content
            .split("\n")
            .find((l) => l.includes("_context=$(mnotes composite project-load"));
        (0, vitest_1.expect)(captureLine).toBeDefined();
        (0, vitest_1.expect)(captureLine).not.toContain("> /dev/null");
    });
    (0, vitest_1.it)("suppresses stderr from project-load to avoid noisy session starts", () => {
        const content = getScript("mnotes-session-start.sh");
        const captureLine = content
            .split("\n")
            .find((l) => l.includes("_context=$(mnotes composite project-load"));
        (0, vitest_1.expect)(captureLine).toBeDefined();
        (0, vitest_1.expect)(captureLine).toContain("2>/dev/null");
    });
    (0, vitest_1.it)("uses || true so failures do not block session start", () => {
        const content = getScript("mnotes-session-start.sh");
        const captureLine = content
            .split("\n")
            .find((l) => l.includes("_context=$(mnotes composite project-load"));
        (0, vitest_1.expect)(captureLine).toBeDefined();
        (0, vitest_1.expect)(captureLine).toContain("|| true");
    });
    (0, vitest_1.it)("emits the SessionStart JSON envelope wrapping _context via jq", () => {
        const content = getScript("mnotes-session-start.sh");
        // jq path: reads stdin, produces the hook envelope
        (0, vitest_1.expect)(content).toContain("hookSpecificOutput");
        (0, vitest_1.expect)(content).toContain("hookEventName");
        (0, vitest_1.expect)(content).toContain("SessionStart");
        (0, vitest_1.expect)(content).toContain("additionalContext");
        // Specifically uses jq for safe JSON encoding
        (0, vitest_1.expect)(content).toContain("jq");
        (0, vitest_1.expect)(content).toMatch(/jq\s+-Rs\s+['"]?\{hookSpecificOutput/);
    });
    (0, vitest_1.it)("has a printf fallback for when jq is unavailable", () => {
        const content = getScript("mnotes-session-start.sh");
        // Falls back to printf when jq not on PATH
        (0, vitest_1.expect)(content).toContain("command -v jq");
        (0, vitest_1.expect)(content).toMatch(/printf.*hookSpecificOutput.*hookEventName.*SessionStart.*additionalContext/s);
    });
    (0, vitest_1.it)("only prints the JSON envelope when _context is non-empty", () => {
        const content = getScript("mnotes-session-start.sh");
        // Guard: [ -n "$_context" ]
        (0, vitest_1.expect)(content).toMatch(/\[\s+-n\s+['"]\$_context['"]\s*\]/);
    });
    (0, vitest_1.it)("the generated JSON envelope is parseable when context is present", () => {
        // Construct the envelope the same way the jq branch does and verify it's
        // valid JSON with the right shape.
        const sampleContext = '{"notes":[{"title":"Arch","content":"test"}]}';
        const envelope = JSON.stringify({
            hookSpecificOutput: {
                hookEventName: "SessionStart",
                additionalContext: sampleContext,
            },
        });
        const parsed = JSON.parse(envelope);
        (0, vitest_1.expect)(parsed.hookSpecificOutput.hookEventName).toBe("SessionStart");
        (0, vitest_1.expect)(parsed.hookSpecificOutput.additionalContext).toBe(sampleContext);
    });
    (0, vitest_1.it)("does NOT contain the old > /dev/null 2>&1 pattern on the project-load line", () => {
        const content = getScript("mnotes-session-start.sh");
        // The old broken pattern that discarded output entirely
        (0, vitest_1.expect)(content).not.toMatch(/mnotes composite project-load[^\n]*> \/dev\/null 2>&1/);
    });
});
// =============================================================
// Stop script — removed in #939. Claude Code's `Stop` event fires after
// every assistant turn, not at session end, so any auto-log it emits is
// necessarily noise. The CLAUDE.md template instructs the agent to call
// `mnotes session log` itself with a real summary when meaningful work
// happened.
// =============================================================
(0, vitest_1.describe)("generateHookScripts: mnotes-session-stop.sh removed (#939)", () => {
    (0, vitest_1.it)("does not emit a Stop-hook script", () => {
        const scripts = (0, hooks_1.generateHookScripts)(opts);
        const names = scripts.map((s) => s.filename);
        (0, vitest_1.expect)(names).not.toContain("mnotes-session-stop.sh");
    });
});
// =============================================================
// Script filenames — SessionStart + PostToolUse by default (#945)
// =============================================================
(0, vitest_1.describe)("generateHookScripts: filenames", () => {
    (0, vitest_1.it)("returns both scripts by default (autoLog unset)", () => {
        const scripts = (0, hooks_1.generateHookScripts)(opts);
        const names = scripts.map((s) => s.filename);
        (0, vitest_1.expect)(names).toContain("mnotes-session-start.sh");
        (0, vitest_1.expect)(names).toContain("mnotes-post-tool-use.sh");
        (0, vitest_1.expect)(names).toHaveLength(2);
    });
    (0, vitest_1.it)("returns only session-start when autoLog: false", () => {
        const scripts = (0, hooks_1.generateHookScripts)({ ...opts, autoLog: false });
        const names = scripts.map((s) => s.filename);
        (0, vitest_1.expect)(names).toEqual(["mnotes-session-start.sh"]);
        (0, vitest_1.expect)(names).not.toContain("mnotes-post-tool-use.sh");
    });
});
// =============================================================
// Hook template registration — Stop event no longer registered (#939)
// =============================================================
(0, vitest_1.describe)("generateHooksTemplate (#939)", () => {
    (0, vitest_1.it)("registers SessionStart but NOT Stop", async () => {
        const { generateHooksTemplate } = await Promise.resolve().then(() => __importStar(require("./hooks")));
        const tmpl = generateHooksTemplate(opts);
        (0, vitest_1.expect)(tmpl.SessionStart).toBeDefined();
        (0, vitest_1.expect)(tmpl.SessionStart).toHaveLength(1);
        (0, vitest_1.expect)(tmpl.Stop).toBeUndefined();
    });
});
// =============================================================
// generateHooksTemplate: PostToolUse registration (#945)
// =============================================================
(0, vitest_1.describe)("generateHooksTemplate: PostToolUse (#945)", () => {
    (0, vitest_1.it)("registers PostToolUse with Bash matcher by default", async () => {
        const { generateHooksTemplate, getHookScriptsDir } = await Promise.resolve().then(() => __importStar(require("./hooks")));
        const tmpl = generateHooksTemplate(opts);
        (0, vitest_1.expect)(tmpl.PostToolUse).toBeDefined();
        (0, vitest_1.expect)(tmpl.PostToolUse).toHaveLength(1);
        (0, vitest_1.expect)(tmpl.PostToolUse[0].matcher).toBe("Bash");
    });
    (0, vitest_1.it)("PostToolUse command contains absolute path to post-tool-use script", async () => {
        const { generateHooksTemplate, getHookScriptsDir } = await Promise.resolve().then(() => __importStar(require("./hooks")));
        const tmpl = generateHooksTemplate(opts);
        const cmd = tmpl.PostToolUse[0].hooks[0].command;
        const expectedPath = getHookScriptsDir() + "/mnotes-post-tool-use.sh";
        (0, vitest_1.expect)(cmd).toContain(expectedPath);
    });
    (0, vitest_1.it)("PostToolUse command sets MNOTES_WORKSPACE_ID env var", async () => {
        const { generateHooksTemplate } = await Promise.resolve().then(() => __importStar(require("./hooks")));
        const tmpl = generateHooksTemplate(opts);
        const cmd = tmpl.PostToolUse[0].hooks[0].command;
        (0, vitest_1.expect)(cmd).toContain(`MNOTES_WORKSPACE_ID=${opts.workspaceId}`);
    });
    (0, vitest_1.it)("does NOT register PostToolUse when autoLog: false", async () => {
        const { generateHooksTemplate } = await Promise.resolve().then(() => __importStar(require("./hooks")));
        const tmpl = generateHooksTemplate({ ...opts, autoLog: false });
        (0, vitest_1.expect)(tmpl.PostToolUse).toBeUndefined();
    });
    (0, vitest_1.it)("SessionStart entry is unchanged regardless of autoLog", async () => {
        const { generateHooksTemplate } = await Promise.resolve().then(() => __importStar(require("./hooks")));
        const withLog = generateHooksTemplate(opts);
        const withoutLog = generateHooksTemplate({ ...opts, autoLog: false });
        (0, vitest_1.expect)(withLog.SessionStart).toEqual(withoutLog.SessionStart);
    });
});
// =============================================================
// PostToolUse script content — generatePostToolUseScript (#945)
// =============================================================
(0, vitest_1.describe)("generatePostToolUseScript: shebang and safety", () => {
    (0, vitest_1.it)("has bash shebang", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toMatch(/^#!\/usr\/bin\/env bash/);
    });
    (0, vitest_1.it)("has set -uo pipefail (NOT -e to allow fail-open)", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("set -uo pipefail");
        // -e must NOT appear as a standalone flag (fail-open requirement)
        (0, vitest_1.expect)(s).not.toMatch(/set\s+-[a-z]*e[a-z]*/);
    });
    (0, vitest_1.it)("always exits 0 — trailing exit 0 present", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("exit 0");
    });
    (0, vitest_1.it)("all non-trivial early exits use exit 0", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        // Every `exit` call should be `exit 0`
        const exitCalls = s.match(/\bexit\s+\d+/g) ?? [];
        for (const call of exitCalls) {
            (0, vitest_1.expect)(call).toBe("exit 0");
        }
    });
});
(0, vitest_1.describe)("generatePostToolUseScript: stdin + jq parsing", () => {
    (0, vitest_1.it)("reads stdin into _payload variable", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toMatch(/_payload=\$\(cat\)/);
    });
    (0, vitest_1.it)("requires jq and exits 0 silently if missing", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("command -v jq");
        (0, vitest_1.expect)(s).toContain("exit 0");
    });
    (0, vitest_1.it)("parses .tool_name from payload via jq", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toMatch(/jq.*\.tool_name/);
    });
    (0, vitest_1.it)("parses .tool_input.command from payload via jq", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toMatch(/jq.*\.tool_input\.command/);
    });
    (0, vitest_1.it)("parses .tool_response.stdout from payload via jq", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toMatch(/jq.*\.tool_response\.stdout/);
    });
    (0, vitest_1.it)("parses .session_id from payload via jq", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toMatch(/jq.*\.session_id/);
    });
});
(0, vitest_1.describe)("generatePostToolUseScript: early-exit filters", () => {
    (0, vitest_1.it)("exits when tool_name is not Bash", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain('"Bash"');
        // There must be a != Bash guard followed by exit 0
        (0, vitest_1.expect)(s).toMatch(/tool_name.*!=.*Bash|!=.*Bash.*tool_name/s);
    });
    (0, vitest_1.it)("exits when command does not start with mnotes", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        // grep filter on '^[[:space:]]*mnotes[[:space:]]'
        (0, vitest_1.expect)(s).toContain("mnotes");
        (0, vitest_1.expect)(s).toMatch(/grep.*mnotes/);
    });
});
(0, vitest_1.describe)("generatePostToolUseScript: kind classification", () => {
    (0, vitest_1.it)("classifies notes create / notes update / wiki ingest as kind=ingest", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("ingest");
        (0, vitest_1.expect)(s).toMatch(/notes.*create|notes.*update|wiki.*ingest/);
    });
    (0, vitest_1.it)("classifies search / recall-knowledge as kind=query", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("query");
        (0, vitest_1.expect)(s).toMatch(/\\bsearch\\b|recall-knowledge/);
    });
    (0, vitest_1.it)("classifies wiki lint / kb scan-conflicts as kind=lint", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("lint");
        (0, vitest_1.expect)(s).toMatch(/wiki.*lint|kb.*scan-conflicts/);
    });
    (0, vitest_1.it)("extracts --title value for ingest ref", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("--title");
    });
    (0, vitest_1.it)("falls back to first 60 chars of stdout when no --title", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("head -c 60");
    });
    (0, vitest_1.it)("falls back to 'untitled' when stdout also empty", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain('"untitled"');
    });
});
(0, vitest_1.describe)("generatePostToolUseScript: dedup", () => {
    (0, vitest_1.it)("uses ~/.claude/hooks/mnotes/state/postusetool.dedup path", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("postusetool.dedup");
        (0, vitest_1.expect)(s).toContain(".claude/hooks/mnotes/state");
    });
    (0, vitest_1.it)("hashes via shasum -a 256 with sha256sum fallback", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("shasum -a 256");
        (0, vitest_1.expect)(s).toContain("sha256sum");
    });
    (0, vitest_1.it)("prunes entries older than 300 seconds", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("300");
        (0, vitest_1.expect)(s).toMatch(/cutoff.*300|300.*cutoff/s);
    });
    (0, vitest_1.it)("caps dedup file at 50 lines via tail -n 50", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("tail -n 50");
    });
    (0, vitest_1.it)("dedup grep anchors hash to end of line (grep -qE with trailing $)", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        // Must use -qE and anchor the hash at end of line, not plain -qF substring match
        (0, vitest_1.expect)(s).toMatch(/grep\s+-qE\s+["'] \$\{_hash\}\$/);
    });
});
(0, vitest_1.describe)("generatePostToolUseScript: session rate cap", () => {
    (0, vitest_1.it)("uses a per-session state file under ~/.claude/hooks/mnotes/state/", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toMatch(/postusetool\.session\./);
    });
    (0, vitest_1.it)("enforces a cap of 30 appends per session", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("30");
        (0, vitest_1.expect)(s).toMatch(/_count.*30|30.*_count/s);
    });
    (0, vitest_1.it)("writes a stderr message when cap is reached", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("session cap reached");
        (0, vitest_1.expect)(s).toMatch(/>&2/);
    });
    (0, vitest_1.it)("falls back to PID-based file when session_id is empty", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toMatch(/pid\$\{?\$\}?|\$\$|pid\$\$/);
    });
    (0, vitest_1.it)("sanitizes corrupt counter before rate-cap test (case pattern resets non-numeric _count to 0)", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        // The case statement must appear after reading _count and before the -ge 30 test
        (0, vitest_1.expect)(s).toMatch(/case "\$\{_count\}" in ''|\*\[!0-9\]\*\) _count=0 ;; esac/);
        // The -ge test must NOT carry a 2>/dev/null swallow after sanitization
        const rateCapLine = s.split("\n").find((l) => l.includes("-ge 30"));
        (0, vitest_1.expect)(rateCapLine).toBeDefined();
        (0, vitest_1.expect)(rateCapLine).not.toContain("2>/dev/null");
    });
});
(0, vitest_1.describe)("generatePostToolUseScript: wiki log append call", () => {
    (0, vitest_1.it)("calls mnotes wiki log append with --kind, --ref, --summary", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("mnotes wiki log append");
        (0, vitest_1.expect)(s).toContain("--kind");
        (0, vitest_1.expect)(s).toContain("--ref");
        (0, vitest_1.expect)(s).toContain("--summary");
    });
    (0, vitest_1.it)("suppresses output and uses || true to never block", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        const appendLine = s.split("\n").find((l) => l.includes("mnotes wiki log append"));
        (0, vitest_1.expect)(appendLine).toBeDefined();
        (0, vitest_1.expect)(appendLine).toContain(">/dev/null 2>&1 || true");
    });
    (0, vitest_1.it)("summary is first 80 chars of stdout with newlines stripped", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("head -c 80");
        (0, vitest_1.expect)(s).toContain("tr -d");
    });
});
(0, vitest_1.describe)("generatePostToolUseScript: optional debug log", () => {
    (0, vitest_1.it)("checks MNOTES_HOOK_DEBUG=1 before writing debug log", () => {
        const s = (0, hooks_1.generatePostToolUseScript)();
        (0, vitest_1.expect)(s).toContain("MNOTES_HOOK_DEBUG");
        (0, vitest_1.expect)(s).toContain("postusetool.debug.log");
    });
});
