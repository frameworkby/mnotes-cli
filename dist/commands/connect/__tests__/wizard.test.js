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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const wizard_1 = require("../wizard");
const hooks_1 = require("../../../templates/claude-code/hooks");
const skills_1 = require("../../../templates/claude-code/skills");
const agents_1 = require("../../../templates/claude-code/agents");
// Mock createClient so resolveWorkspace can validate workspaces without a real server
vitest_1.vi.mock("../../../client", () => ({
    createClient: () => ({
        listWorkspaces: async () => ({
            data: [
                { id: "ws-123", name: "Test", slug: "test-123", isDefault: true },
            ],
        }),
        createWorkspace: async (name) => ({
            data: { id: name, name, slug: name, isDefault: false },
        }),
        wikiBootstrap: async (_workspaceId) => ({
            index: "created",
            log: "created",
        }),
    }),
}));
function makeTmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), "mnotes-wizard-test-"));
}
function cleanTmpDir(dir) {
    fs.rmSync(dir, { recursive: true, force: true });
}
const DEFAULT_OPTS = {
    url: "http://localhost:3000",
    workspaceId: "ws-test-123",
};
// =============================================================
// T-1: Template generation — hooks
// =============================================================
(0, vitest_1.describe)("hooks template", () => {
    (0, vitest_1.it)("generates SessionStart hook referencing global bash script path", () => {
        const hooks = (0, hooks_1.generateHooksTemplate)(DEFAULT_OPTS);
        (0, vitest_1.expect)(hooks.SessionStart).toBeDefined();
        (0, vitest_1.expect)(hooks.SessionStart).toHaveLength(1);
        (0, vitest_1.expect)(hooks.SessionStart[0].matcher).toBe("");
        (0, vitest_1.expect)(hooks.SessionStart[0].hooks).toHaveLength(1);
        (0, vitest_1.expect)(hooks.SessionStart[0].hooks[0].type).toBe("command");
        // Global path — resolves at generation time via os.homedir().
        // Format: MNOTES_WORKSPACE_ID=<id> /absolute/path/to/script.sh
        const cmd = hooks.SessionStart[0].hooks[0].command;
        (0, vitest_1.expect)(cmd).toContain(path.join(".claude", "hooks", "mnotes", "scripts", "mnotes-session-start.sh"));
        (0, vitest_1.expect)(cmd).toContain(DEFAULT_OPTS.workspaceId);
        // The env-var prefix is followed by a space and an absolute script path
        const scriptPath = cmd.split(" ").slice(1).join(" ");
        (0, vitest_1.expect)(path.isAbsolute(scriptPath)).toBe(true);
    });
    (0, vitest_1.it)("generates hook scripts using MNOTES_WORKSPACE_ID env var (not --workspace-id flag)", () => {
        const scripts = (0, hooks_1.generateHookScripts)(DEFAULT_OPTS);
        // After #939 only SessionStart remains; after #945 PostToolUse is added by default.
        (0, vitest_1.expect)(scripts.length).toBeGreaterThanOrEqual(1);
        const startScript = scripts.find((s) => s.filename === "mnotes-session-start.sh");
        (0, vitest_1.expect)(startScript.content).toContain("mnotes composite project-load");
        (0, vitest_1.expect)(startScript.content).not.toContain("/api/mcp");
        // workspaceId is resolved via env var — no --workspace-id flag in scripts
        (0, vitest_1.expect)(startScript.content).toContain("MNOTES_WORKSPACE_ID");
        (0, vitest_1.expect)(startScript.content).not.toContain("--workspace-id");
        (0, vitest_1.expect)(startScript.content).not.toContain("ws-test-123");
        // Stop-hook script removed in #939
        (0, vitest_1.expect)(scripts.find((s) => s.filename === "mnotes-session-stop.sh")).toBeUndefined();
    });
    (0, vitest_1.it)("strips trailing slashes from URL in hook scripts", () => {
        const scripts = (0, hooks_1.generateHookScripts)({ url: "http://example.com///", workspaceId: "ws-1" });
        const startScript = scripts.find((s) => s.filename === "mnotes-session-start.sh");
        (0, vitest_1.expect)(startScript.content).toContain("mnotes composite project-load");
        (0, vitest_1.expect)(startScript.content).not.toContain("///");
    });
});
// =============================================================
// T-1: Template generation — skills
// =============================================================
(0, vitest_1.describe)("skills templates", () => {
    (0, vitest_1.it)("generates two skill files", () => {
        const skills = (0, skills_1.generateSkillTemplates)(DEFAULT_OPTS);
        (0, vitest_1.expect)(skills).toHaveLength(2);
    });
    (0, vitest_1.it)("generates store and recall skills as SKILL.md inside their own folder (AC-1)", () => {
        const skills = (0, skills_1.generateSkillTemplates)(DEFAULT_OPTS);
        const paths = skills.map((s) => s.path);
        (0, vitest_1.expect)(paths).toContain("mnotes-store/SKILL.md");
        (0, vitest_1.expect)(paths).toContain("mnotes-recall/SKILL.md");
    });
    (0, vitest_1.it)("includes m-notes generated header (AC-8)", () => {
        const skills = (0, skills_1.generateSkillTemplates)(DEFAULT_OPTS);
        for (const skill of skills) {
            (0, vitest_1.expect)(skill.content).toContain("Generated by m-notes CLI");
        }
    });
    (0, vitest_1.it)("instructs Claude to invoke the mnotes CLI (not removed MCP tools)", () => {
        const skills = (0, skills_1.generateSkillTemplates)(DEFAULT_OPTS);
        const store = skills.find((s) => s.path === "mnotes-store/SKILL.md");
        const recall = skills.find((s) => s.path === "mnotes-recall/SKILL.md");
        (0, vitest_1.expect)(store?.content).toContain("mnotes kb store");
        (0, vitest_1.expect)(recall?.content).toContain("mnotes kb recall");
        // Workspace is resolved from CLI config — skills should not interpolate it.
        for (const skill of skills) {
            (0, vitest_1.expect)(skill.content).not.toContain("ws-test-123");
        }
        // Removed MCP tool names must not appear — they would direct Claude to
        // invoke tools that no longer exist.
        for (const skill of skills) {
            (0, vitest_1.expect)(skill.content).not.toMatch(/\bknowledge_store\b/);
            (0, vitest_1.expect)(skill.content).not.toMatch(/\brecall_knowledge\b/);
            (0, vitest_1.expect)(skill.content).not.toMatch(/MCP tool/i);
        }
    });
    (0, vitest_1.it)("includes frontmatter with name and description and omits non-standard fields", () => {
        const skills = (0, skills_1.generateSkillTemplates)(DEFAULT_OPTS);
        for (const skill of skills) {
            (0, vitest_1.expect)(skill.content).toContain("---");
            (0, vitest_1.expect)(skill.content).toContain("name:");
            (0, vitest_1.expect)(skill.content).toContain("description:");
            (0, vitest_1.expect)(skill.content).not.toMatch(/^trigger:/m);
        }
    });
});
// =============================================================
// T-1: Template generation — agents
// =============================================================
(0, vitest_1.describe)("agents templates", () => {
    (0, vitest_1.it)("generates one agent file", () => {
        const agents = (0, agents_1.generateAgentTemplates)(DEFAULT_OPTS);
        (0, vitest_1.expect)(agents).toHaveLength(1);
    });
    (0, vitest_1.it)("generates knowledge-manager agent", () => {
        const agents = (0, agents_1.generateAgentTemplates)(DEFAULT_OPTS);
        (0, vitest_1.expect)(agents[0].filename).toBe("knowledge-manager.md");
    });
    (0, vitest_1.it)("includes m-notes generated header (AC-8)", () => {
        const agents = (0, agents_1.generateAgentTemplates)(DEFAULT_OPTS);
        for (const agent of agents) {
            (0, vitest_1.expect)(agent.content).toContain("Generated by m-notes CLI");
        }
    });
    (0, vitest_1.it)("includes workspaceId in agent content", () => {
        const agents = (0, agents_1.generateAgentTemplates)(DEFAULT_OPTS);
        (0, vitest_1.expect)(agents[0].content).toContain("ws-test-123");
    });
    (0, vitest_1.it)("includes frontmatter with name and description", () => {
        const agents = (0, agents_1.generateAgentTemplates)(DEFAULT_OPTS);
        (0, vitest_1.expect)(agents[0].content).toContain("---");
        (0, vitest_1.expect)(agents[0].content).toContain("name: knowledge-manager");
        (0, vitest_1.expect)(agents[0].content).toContain("description:");
    });
});
// =============================================================
// T-2: Wizard choices structure
// =============================================================
(0, vitest_1.describe)("wizard choices", () => {
    (0, vitest_1.it)("has four items: hooks, skills, agents, wiki-bootstrap", () => {
        (0, vitest_1.expect)(wizard_1.ALL_WIZARD_ITEMS).toEqual(["hooks", "skills", "agents", "wiki-bootstrap"]);
    });
    (0, vitest_1.it)("each choice has value, label, and description", () => {
        for (const choice of wizard_1.WIZARD_CHOICES) {
            (0, vitest_1.expect)(choice.value).toBeTruthy();
            (0, vitest_1.expect)(choice.label).toBeTruthy();
            (0, vitest_1.expect)(choice.description).toBeTruthy();
        }
    });
});
// =============================================================
// T-3: scaffoldItems — hooks
// =============================================================
(0, vitest_1.describe)("scaffoldItems: hooks", () => {
    let tmpDir;
    let fakeHome;
    let origHome;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
        fakeHome = makeTmpDir();
        origHome = process.env.HOME;
        process.env.HOME = fakeHome;
    });
    (0, vitest_1.afterEach)(() => {
        cleanTmpDir(tmpDir);
        cleanTmpDir(fakeHome);
        if (origHome === undefined)
            delete process.env.HOME;
        else
            process.env.HOME = origHome;
    });
    (0, vitest_1.it)("writes scripts to global ~/.claude/hooks/mnotes/scripts/ and settings.json to project (AC-4)", async () => {
        const results = await (0, wizard_1.scaffoldItems)(tmpDir, ["hooks"], DEFAULT_OPTS);
        (0, vitest_1.expect)(results).toHaveLength(1);
        (0, vitest_1.expect)(results[0].item).toBe("hooks");
        // 2 bash scripts (SessionStart + PostToolUse after #945) + settings.json
        (0, vitest_1.expect)(results[0].filesWritten).toHaveLength(3);
        // settings.json is project-local
        const settingsPath = path.join(tmpDir, ".claude", "settings.json");
        (0, vitest_1.expect)(fs.existsSync(settingsPath)).toBe(true);
        const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
        (0, vitest_1.expect)(settings.hooks).toBeDefined();
        (0, vitest_1.expect)(settings.hooks.SessionStart).toBeDefined();
        (0, vitest_1.expect)(settings.hooks.SessionStart).toHaveLength(1);
        // No Stop hook registered after #939
        (0, vitest_1.expect)(settings.hooks.Stop).toBeUndefined();
        // Bash script lives under fake HOME at ~/.claude/hooks/mnotes/scripts/
        const globalScriptsDir = path.join(fakeHome, ".claude", "hooks", "mnotes", "scripts");
        const startScript = path.join(globalScriptsDir, "mnotes-session-start.sh");
        (0, vitest_1.expect)(fs.existsSync(startScript)).toBe(true);
        // Stop-hook script no longer emitted after #939
        (0, vitest_1.expect)(fs.existsSync(path.join(globalScriptsDir, "mnotes-session-stop.sh"))).toBe(false);
        // Project directory must NOT contain scripts
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "hooks"))).toBe(false);
        // settings.json command exports MNOTES_WORKSPACE_ID then runs the script
        (0, vitest_1.expect)(settings.hooks.SessionStart[0].hooks[0].command).toBe(`MNOTES_WORKSPACE_ID=${DEFAULT_OPTS.workspaceId} ${startScript}`);
        const startContent = fs.readFileSync(startScript, "utf-8");
        (0, vitest_1.expect)(startContent).toContain("mnotes composite project-load");
        (0, vitest_1.expect)(startContent).not.toContain("--workspace-id");
    });
    (0, vitest_1.it)("merges hooks into existing settings.json (AC-5)", async () => {
        const claudeDir = path.join(tmpDir, ".claude");
        fs.mkdirSync(claudeDir, { recursive: true });
        const existingSettings = {
            permissions: { allow: ["Read"] },
            hooks: {
                PreToolUse: [{ type: "command", command: "echo pre-tool" }],
            },
        };
        fs.writeFileSync(path.join(claudeDir, "settings.json"), JSON.stringify(existingSettings, null, 2), "utf-8");
        await (0, wizard_1.scaffoldItems)(tmpDir, ["hooks"], DEFAULT_OPTS);
        const settings = JSON.parse(fs.readFileSync(path.join(claudeDir, "settings.json"), "utf-8"));
        // Existing settings preserved
        (0, vitest_1.expect)(settings.permissions.allow).toEqual(["Read"]);
        // Existing hooks preserved
        (0, vitest_1.expect)(settings.hooks.PreToolUse).toHaveLength(1);
        (0, vitest_1.expect)(settings.hooks.PreToolUse[0].command).toBe("echo pre-tool");
        // New hooks added
        (0, vitest_1.expect)(settings.hooks.SessionStart).toHaveLength(1);
    });
    (0, vitest_1.it)("does not duplicate hooks on re-run (AC-5)", async () => {
        await (0, wizard_1.scaffoldItems)(tmpDir, ["hooks"], DEFAULT_OPTS);
        await (0, wizard_1.scaffoldItems)(tmpDir, ["hooks"], DEFAULT_OPTS);
        const settings = JSON.parse(fs.readFileSync(path.join(tmpDir, ".claude", "settings.json"), "utf-8"));
        (0, vitest_1.expect)(settings.hooks.SessionStart).toHaveLength(1);
    });
    // #938 / #939 — legacy m-notes hook entries (positional workspace-id, no
    // env var prefix) get cleaned up: SessionStart is replaced with the current
    // form; Stop entries are removed entirely (no replacement) since #939 no
    // longer registers a Stop hook.
    (0, vitest_1.it)("replaces legacy SessionStart and removes legacy Stop on re-run (#938/#939)", async () => {
        const claudeDir = path.join(tmpDir, ".claude");
        fs.mkdirSync(claudeDir, { recursive: true });
        const legacyStart = `/some/old/path/mnotes-session-start.sh ws-legacy-id`;
        const legacyStop = `/some/old/path/mnotes-session-stop.sh ws-legacy-id`;
        const existingSettings = {
            hooks: {
                SessionStart: [
                    { matcher: "", hooks: [{ type: "command", command: legacyStart }] },
                ],
                Stop: [
                    { matcher: "", hooks: [{ type: "command", command: legacyStop }] },
                ],
            },
        };
        fs.writeFileSync(path.join(claudeDir, "settings.json"), JSON.stringify(existingSettings, null, 2), "utf-8");
        await (0, wizard_1.scaffoldItems)(tmpDir, ["hooks"], DEFAULT_OPTS);
        const settings = JSON.parse(fs.readFileSync(path.join(claudeDir, "settings.json"), "utf-8"));
        (0, vitest_1.expect)(settings.hooks.SessionStart).toHaveLength(1);
        (0, vitest_1.expect)(settings.hooks.SessionStart[0].hooks[0].command).toContain(`MNOTES_WORKSPACE_ID=${DEFAULT_OPTS.workspaceId}`);
        (0, vitest_1.expect)(settings.hooks.SessionStart[0].hooks[0].command).not.toContain("ws-legacy-id");
        // Stop event is removed entirely — no current-form Stop entry, no legacy
        // entry left behind. (#939)
        (0, vitest_1.expect)(settings.hooks.Stop).toBeUndefined();
    });
    (0, vitest_1.it)("removes a legacy Stop entry while preserving non-mnotes Stop hooks (#939)", async () => {
        const claudeDir = path.join(tmpDir, ".claude");
        fs.mkdirSync(claudeDir, { recursive: true });
        const userStop = `/usr/local/bin/my-stop-tool.sh`;
        const legacyStop = `/old/path/mnotes-session-stop.sh ws-legacy-id`;
        const existingSettings = {
            hooks: {
                Stop: [
                    { matcher: "", hooks: [{ type: "command", command: userStop }] },
                    { matcher: "", hooks: [{ type: "command", command: legacyStop }] },
                ],
            },
        };
        fs.writeFileSync(path.join(claudeDir, "settings.json"), JSON.stringify(existingSettings, null, 2), "utf-8");
        await (0, wizard_1.scaffoldItems)(tmpDir, ["hooks"], DEFAULT_OPTS);
        const settings = JSON.parse(fs.readFileSync(path.join(claudeDir, "settings.json"), "utf-8"));
        // Non-mnotes Stop hook preserved; legacy mnotes Stop entry removed.
        const stopCommands = (settings.hooks.Stop ?? []).flatMap((e) => e.hooks.map((h) => h.command));
        (0, vitest_1.expect)(stopCommands).toContain(userStop);
        (0, vitest_1.expect)(stopCommands.some((c) => c.includes("mnotes-session-stop.sh"))).toBe(false);
    });
    (0, vitest_1.it)("preserves non-mnotes hooks on the same events (#938)", async () => {
        const claudeDir = path.join(tmpDir, ".claude");
        fs.mkdirSync(claudeDir, { recursive: true });
        const userStart = `/usr/local/bin/my-other-tool.sh`;
        const existingSettings = {
            hooks: {
                SessionStart: [
                    { matcher: "", hooks: [{ type: "command", command: userStart }] },
                    {
                        matcher: "",
                        hooks: [
                            {
                                type: "command",
                                command: "/old/mnotes-session-start.sh ws-legacy-id",
                            },
                        ],
                    },
                ],
            },
        };
        fs.writeFileSync(path.join(claudeDir, "settings.json"), JSON.stringify(existingSettings, null, 2), "utf-8");
        await (0, wizard_1.scaffoldItems)(tmpDir, ["hooks"], DEFAULT_OPTS);
        const settings = JSON.parse(fs.readFileSync(path.join(claudeDir, "settings.json"), "utf-8"));
        // Non-mnotes hook preserved
        const commands = settings.hooks.SessionStart.flatMap((e) => e.hooks.map((h) => h.command));
        (0, vitest_1.expect)(commands).toContain(userStart);
        // Legacy mnotes entry removed
        (0, vitest_1.expect)(commands.some((c) => c.includes("ws-legacy-id"))).toBe(false);
        // Current mnotes entry present exactly once
        (0, vitest_1.expect)(commands.filter((c) => c.includes("mnotes-session-start.sh")).length).toBe(1);
    });
    (0, vitest_1.it)("idempotent: running connect three times produces a single SessionStart entry, no Stop (#938/#939)", async () => {
        await (0, wizard_1.scaffoldItems)(tmpDir, ["hooks"], DEFAULT_OPTS);
        await (0, wizard_1.scaffoldItems)(tmpDir, ["hooks"], DEFAULT_OPTS);
        await (0, wizard_1.scaffoldItems)(tmpDir, ["hooks"], DEFAULT_OPTS);
        const settings = JSON.parse(fs.readFileSync(path.join(tmpDir, ".claude", "settings.json"), "utf-8"));
        const startCommands = settings.hooks.SessionStart.flatMap((e) => e.hooks.map((h) => h.command));
        (0, vitest_1.expect)(startCommands.filter((c) => c.includes("mnotes-session-start.sh")).length).toBe(1);
        // After #939 we don't register Stop at all on a clean install.
        (0, vitest_1.expect)(settings.hooks.Stop).toBeUndefined();
    });
});
// =============================================================
// T-3: scaffoldItems — skills
// =============================================================
(0, vitest_1.describe)("scaffoldItems: skills", () => {
    let tmpDir;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
    });
    (0, vitest_1.afterEach)(() => {
        cleanTmpDir(tmpDir);
    });
    (0, vitest_1.it)("creates skill files as .claude/skills/<name>/SKILL.md (AC-4)", async () => {
        const results = await (0, wizard_1.scaffoldItems)(tmpDir, ["skills"], DEFAULT_OPTS);
        (0, vitest_1.expect)(results).toHaveLength(1);
        (0, vitest_1.expect)(results[0].item).toBe("skills");
        (0, vitest_1.expect)(results[0].filesWritten.length).toBeGreaterThan(0);
        const skillsDir = path.join(tmpDir, ".claude", "skills");
        (0, vitest_1.expect)(fs.existsSync(path.join(skillsDir, "mnotes-store", "SKILL.md"))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(skillsDir, "mnotes-recall", "SKILL.md"))).toBe(true);
    });
    (0, vitest_1.it)("generated skill files include header (AC-8)", async () => {
        await (0, wizard_1.scaffoldItems)(tmpDir, ["skills"], DEFAULT_OPTS);
        const storeContent = fs.readFileSync(path.join(tmpDir, ".claude", "skills", "mnotes-store", "SKILL.md"), "utf-8");
        (0, vitest_1.expect)(storeContent).toContain("Generated by m-notes CLI");
    });
    (0, vitest_1.it)("preserves user-created skill files (AC-5)", async () => {
        const storeDir = path.join(tmpDir, ".claude", "skills", "mnotes-store");
        fs.mkdirSync(storeDir, { recursive: true });
        // Write a user-created file at the same path
        fs.writeFileSync(path.join(storeDir, "SKILL.md"), "# My custom store skill\nCustom content here", "utf-8");
        await (0, wizard_1.scaffoldItems)(tmpDir, ["skills"], DEFAULT_OPTS);
        // The user file should be preserved
        const content = fs.readFileSync(path.join(storeDir, "SKILL.md"), "utf-8");
        (0, vitest_1.expect)(content).toContain("My custom store skill");
        (0, vitest_1.expect)(content).not.toContain("Generated by m-notes CLI");
        // The recall skill should still be written (new file)
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "skills", "mnotes-recall", "SKILL.md"))).toBe(true);
    });
    (0, vitest_1.it)("overwrites m-notes generated skill files on re-run (AC-5)", async () => {
        const skillPath = path.join(tmpDir, ".claude", "skills", "mnotes-store", "SKILL.md");
        // Seed file with stale content that an older CLI version would have written.
        fs.mkdirSync(path.dirname(skillPath), { recursive: true });
        fs.writeFileSync(skillPath, "<!-- Generated by m-notes CLI. Do not edit manually. -->\nold-stale-content\n", "utf-8");
        await (0, wizard_1.scaffoldItems)(tmpDir, ["skills"], { url: "http://new-url.com", workspaceId: "ws-new" });
        const content = fs.readFileSync(skillPath, "utf-8");
        // Stale content gone, current template installed (CLI command surface).
        (0, vitest_1.expect)(content).not.toContain("old-stale-content");
        (0, vitest_1.expect)(content).toContain("mnotes kb store");
    });
});
// =============================================================
// T-3: scaffoldItems — agents
// =============================================================
(0, vitest_1.describe)("scaffoldItems: agents", () => {
    let tmpDir;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
    });
    (0, vitest_1.afterEach)(() => {
        cleanTmpDir(tmpDir);
    });
    (0, vitest_1.it)("creates agent files in .claude/agents/ (AC-4)", async () => {
        const results = await (0, wizard_1.scaffoldItems)(tmpDir, ["agents"], DEFAULT_OPTS);
        (0, vitest_1.expect)(results).toHaveLength(1);
        (0, vitest_1.expect)(results[0].item).toBe("agents");
        (0, vitest_1.expect)(results[0].filesWritten.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "agents", "knowledge-manager.md"))).toBe(true);
    });
    (0, vitest_1.it)("generated agent files include header (AC-8)", async () => {
        await (0, wizard_1.scaffoldItems)(tmpDir, ["agents"], DEFAULT_OPTS);
        const content = fs.readFileSync(path.join(tmpDir, ".claude", "agents", "knowledge-manager.md"), "utf-8");
        (0, vitest_1.expect)(content).toContain("Generated by m-notes CLI");
    });
    (0, vitest_1.it)("preserves user-created agent files (AC-5)", async () => {
        const agentsDir = path.join(tmpDir, ".claude", "agents");
        fs.mkdirSync(agentsDir, { recursive: true });
        fs.writeFileSync(path.join(agentsDir, "knowledge-manager.md"), "# My custom agent\nCustom agent content", "utf-8");
        await (0, wizard_1.scaffoldItems)(tmpDir, ["agents"], DEFAULT_OPTS);
        const content = fs.readFileSync(path.join(agentsDir, "knowledge-manager.md"), "utf-8");
        (0, vitest_1.expect)(content).toContain("My custom agent");
    });
});
// =============================================================
// T-3: scaffoldItems — all items at once
// =============================================================
(0, vitest_1.describe)("scaffoldItems: all items", () => {
    let tmpDir;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
    });
    (0, vitest_1.afterEach)(() => {
        cleanTmpDir(tmpDir);
    });
    (0, vitest_1.it)("scaffolds hooks, skills, agents, and wiki-bootstrap when all selected (AC-7)", async () => {
        const mockClient = {
            wikiBootstrap: vitest_1.vi.fn().mockResolvedValue({ index: "created", log: "created" }),
        };
        const results = await (0, wizard_1.scaffoldItems)(tmpDir, wizard_1.ALL_WIZARD_ITEMS, { ...DEFAULT_OPTS, client: mockClient });
        (0, vitest_1.expect)(results).toHaveLength(4);
        const items = results.map((r) => r.item);
        (0, vitest_1.expect)(items).toContain("hooks");
        (0, vitest_1.expect)(items).toContain("skills");
        (0, vitest_1.expect)(items).toContain("agents");
        (0, vitest_1.expect)(items).toContain("wiki-bootstrap");
        // Verify files exist
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "settings.json"))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "skills", "mnotes-store", "SKILL.md"))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "skills", "mnotes-recall", "SKILL.md"))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "agents", "knowledge-manager.md"))).toBe(true);
    });
    (0, vitest_1.it)("scaffolds partial selection", async () => {
        const results = await (0, wizard_1.scaffoldItems)(tmpDir, ["hooks", "agents"], DEFAULT_OPTS);
        (0, vitest_1.expect)(results).toHaveLength(2);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "settings.json"))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "agents", "knowledge-manager.md"))).toBe(true);
        // Skills should NOT exist
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "skills"))).toBe(false);
    });
});
// =============================================================
// T-3: scaffoldItems — wiki-bootstrap
// =============================================================
(0, vitest_1.describe)("scaffoldItems: wiki-bootstrap", () => {
    (0, vitest_1.it)("calls client.wikiBootstrap with the resolved workspaceId and returns synthetic strings", async () => {
        const mockWikiBootstrap = vitest_1.vi.fn().mockResolvedValue({ index: "created", log: "exists" });
        const mockClient = { wikiBootstrap: mockWikiBootstrap };
        const results = await (0, wizard_1.scaffoldItems)(".", ["wiki-bootstrap"], {
            ...DEFAULT_OPTS,
            client: mockClient,
        });
        (0, vitest_1.expect)(mockWikiBootstrap).toHaveBeenCalledOnce();
        (0, vitest_1.expect)(mockWikiBootstrap).toHaveBeenCalledWith(DEFAULT_OPTS.workspaceId);
        (0, vitest_1.expect)(results).toHaveLength(1);
        (0, vitest_1.expect)(results[0].item).toBe("wiki-bootstrap");
        (0, vitest_1.expect)(results[0].filesWritten).toEqual([
            "[api] wiki/index: created",
            "[api] wiki/log: exists",
        ]);
    });
    (0, vitest_1.it)("reflects both 'exists' statuses when notes already present", async () => {
        const mockClient = {
            wikiBootstrap: vitest_1.vi.fn().mockResolvedValue({ index: "exists", log: "exists" }),
        };
        const results = await (0, wizard_1.scaffoldItems)(".", ["wiki-bootstrap"], {
            ...DEFAULT_OPTS,
            client: mockClient,
        });
        (0, vitest_1.expect)(results[0].filesWritten).toEqual([
            "[api] wiki/index: exists",
            "[api] wiki/log: exists",
        ]);
    });
    (0, vitest_1.it)("throws if no client is provided", async () => {
        await (0, vitest_1.expect)((0, wizard_1.scaffoldItems)(".", ["wiki-bootstrap"], DEFAULT_OPTS)).rejects.toThrow("wiki-bootstrap requires a client instance");
    });
    (0, vitest_1.it)("mixed run: hooks + wiki-bootstrap — both execute and produce the right summary", async () => {
        const tmpDir = makeTmpDir();
        const fakeHome = makeTmpDir();
        const origHome = process.env.HOME;
        process.env.HOME = fakeHome;
        try {
            const mockClient = {
                wikiBootstrap: vitest_1.vi.fn().mockResolvedValue({ index: "created", log: "created" }),
            };
            const results = await (0, wizard_1.scaffoldItems)(tmpDir, ["hooks", "wiki-bootstrap"], {
                ...DEFAULT_OPTS,
                client: mockClient,
            });
            (0, vitest_1.expect)(results).toHaveLength(2);
            const hooksResult = results.find((r) => r.item === "hooks");
            const wikiResult = results.find((r) => r.item === "wiki-bootstrap");
            (0, vitest_1.expect)(hooksResult).toBeDefined();
            (0, vitest_1.expect)(hooksResult.filesWritten.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(wikiResult).toBeDefined();
            (0, vitest_1.expect)(wikiResult.filesWritten).toEqual([
                "[api] wiki/index: created",
                "[api] wiki/log: created",
            ]);
            // hooks file exists on disk; wiki-bootstrap writes nothing to disk
            (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "settings.json"))).toBe(true);
        }
        finally {
            process.env.HOME = origHome;
            cleanTmpDir(tmpDir);
            cleanTmpDir(fakeHome);
        }
    });
    (0, vitest_1.it)("surfaces API errors without swallowing them", async () => {
        const mockClient = {
            wikiBootstrap: vitest_1.vi.fn().mockRejectedValue(new Error("API unavailable")),
        };
        await (0, vitest_1.expect)((0, wizard_1.scaffoldItems)(".", ["wiki-bootstrap"], { ...DEFAULT_OPTS, client: mockClient })).rejects.toThrow("API unavailable");
    });
});
// =============================================================
// T-4/T-5: --no-wizard and --all flags via handleClaudeCode
// =============================================================
(0, vitest_1.describe)("handleClaudeCode with wizard flags", () => {
    let tmpDir;
    let fakeHome;
    let origHome;
    let origCwd;
    let origExit;
    let exitCode;
    let origWorkspaceId;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
        fakeHome = makeTmpDir();
        origHome = process.env.HOME;
        process.env.HOME = fakeHome;
        origCwd = process.cwd;
        process.cwd = () => tmpDir;
        exitCode = undefined;
        origExit = process.exit;
        process.exit = ((code) => {
            exitCode = code;
            throw new Error(`process.exit(${code})`);
        });
        origWorkspaceId = process.env.MNOTES_WORKSPACE_ID;
        process.env.MNOTES_WORKSPACE_ID = "ws-123";
    });
    (0, vitest_1.afterEach)(() => {
        process.cwd = origCwd;
        process.exit = origExit;
        cleanTmpDir(tmpDir);
        cleanTmpDir(fakeHome);
        if (origHome === undefined)
            delete process.env.HOME;
        else
            process.env.HOME = origHome;
        if (origWorkspaceId !== undefined)
            process.env.MNOTES_WORKSPACE_ID = origWorkspaceId;
        else
            delete process.env.MNOTES_WORKSPACE_ID;
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)("--no-wizard does core setup only, no extras (AC-6)", async () => {
        const configUtils = await Promise.resolve().then(() => __importStar(require("../config-utils")));
        vitest_1.vi.spyOn(configUtils, "validateConnection").mockResolvedValue({ ok: true });
        const { handleClaudeCode } = await Promise.resolve().then(() => __importStar(require("../index")));
        const origLog = console.log;
        console.log = () => { };
        try {
            await handleClaudeCode({
                url: "http://localhost:3000",
                apiKey: "test-key",
                noWizard: true,
            });
        }
        finally {
            console.log = origLog;
        }
        // Core setup file (CLAUDE.md) should exist; .mcp.json must NOT (#594, #777)
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".mcp.json"))).toBe(false);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, "CLAUDE.md"))).toBe(true);
        // Wizard extras should NOT exist
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "settings.json"))).toBe(false);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "skills"))).toBe(false);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "agents"))).toBe(false);
    });
    (0, vitest_1.it)("--all installs everything without prompting (AC-7)", async () => {
        const configUtils = await Promise.resolve().then(() => __importStar(require("../config-utils")));
        vitest_1.vi.spyOn(configUtils, "validateConnection").mockResolvedValue({ ok: true });
        const { handleClaudeCode } = await Promise.resolve().then(() => __importStar(require("../index")));
        const origLog = console.log;
        let output = "";
        console.log = (...args) => {
            output += args.join(" ") + "\n";
        };
        try {
            await handleClaudeCode({
                url: "http://localhost:3000",
                apiKey: "test-key",
                all: true,
            });
        }
        finally {
            console.log = origLog;
        }
        // Core setup — CLAUDE.md only; .mcp.json must NOT be written (#594, #777)
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".mcp.json"))).toBe(false);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, "CLAUDE.md"))).toBe(true);
        // All extras should exist
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "settings.json"))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "skills", "mnotes-store", "SKILL.md"))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "skills", "mnotes-recall", "SKILL.md"))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "agents", "knowledge-manager.md"))).toBe(true);
        // Output should mention extras
        (0, vitest_1.expect)(output).toContain("Extras installed:");
    });
});
// =============================================================
// T-5: CLI flag integration via commander
// =============================================================
(0, vitest_1.describe)("CLI flag integration", () => {
    let tmpDir;
    let fakeHome;
    let origHome;
    let origCwd;
    let origExit;
    let origWorkspaceId;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
        fakeHome = makeTmpDir();
        origHome = process.env.HOME;
        process.env.HOME = fakeHome;
        origCwd = process.cwd;
        process.cwd = () => tmpDir;
        origExit = process.exit;
        process.exit = ((code) => {
            throw new Error(`process.exit(${code})`);
        });
        origWorkspaceId = process.env.MNOTES_WORKSPACE_ID;
        process.env.MNOTES_WORKSPACE_ID = "ws-123";
    });
    (0, vitest_1.afterEach)(() => {
        process.cwd = origCwd;
        process.exit = origExit;
        cleanTmpDir(tmpDir);
        cleanTmpDir(fakeHome);
        if (origHome === undefined)
            delete process.env.HOME;
        else
            process.env.HOME = origHome;
        if (origWorkspaceId !== undefined)
            process.env.MNOTES_WORKSPACE_ID = origWorkspaceId;
        else
            delete process.env.MNOTES_WORKSPACE_ID;
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)("--no-wizard flag is recognized by commander", async () => {
        const configUtils = await Promise.resolve().then(() => __importStar(require("../config-utils")));
        vitest_1.vi.spyOn(configUtils, "validateConnection").mockResolvedValue({ ok: true });
        const { Command } = await Promise.resolve().then(() => __importStar(require("commander")));
        const { registerConnectCommand } = await Promise.resolve().then(() => __importStar(require("../index")));
        const program = new Command();
        program.exitOverride();
        registerConnectCommand(program);
        const origLog = console.log;
        console.log = () => { };
        try {
            await program.parseAsync([
                "node", "mnotes", "connect", "claude-code",
                "--url", "http://localhost:3000",
                "--api-key", "test-key",
                "--no-wizard",
            ]);
        }
        finally {
            console.log = origLog;
        }
        // Only CLAUDE.md (core), no .mcp.json (#594, #777), no wizard extras
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, "CLAUDE.md"))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".mcp.json"))).toBe(false);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "settings.json"))).toBe(false);
    });
    (0, vitest_1.it)("--all flag is recognized by commander", async () => {
        const configUtils = await Promise.resolve().then(() => __importStar(require("../config-utils")));
        vitest_1.vi.spyOn(configUtils, "validateConnection").mockResolvedValue({ ok: true });
        const { Command } = await Promise.resolve().then(() => __importStar(require("commander")));
        const { registerConnectCommand } = await Promise.resolve().then(() => __importStar(require("../index")));
        const program = new Command();
        program.exitOverride();
        registerConnectCommand(program);
        const origLog = console.log;
        console.log = () => { };
        try {
            await program.parseAsync([
                "node", "mnotes", "connect", "claude-code",
                "--url", "http://localhost:3000",
                "--api-key", "test-key",
                "--all",
            ]);
        }
        finally {
            console.log = origLog;
        }
        // All extras should exist
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "settings.json"))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "skills", "mnotes-store", "SKILL.md"))).toBe(true);
        (0, vitest_1.expect)(fs.existsSync(path.join(tmpDir, ".claude", "agents", "knowledge-manager.md"))).toBe(true);
    });
});
