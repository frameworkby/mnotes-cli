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
exports.ALL_WIZARD_ITEMS = exports.WIZARD_CHOICES = void 0;
exports.promptWizardSelection = promptWizardSelection;
exports.scaffoldItems = scaffoldItems;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const index_1 = require("../../templates/claude-code/index");
exports.WIZARD_CHOICES = [
    { value: "hooks", label: "Session hooks", description: "Auto-load context on session start" },
    { value: "skills", label: "Skills (/store, /recall)", description: "Slash commands for knowledge management" },
    { value: "agents", label: "Knowledge manager agent", description: "Agent for managing project knowledge" },
];
exports.ALL_WIZARD_ITEMS = exports.WIZARD_CHOICES.map((c) => c.value);
/**
 * Prompts the user to select which extras to install.
 * Returns the selected items. All are selected by default.
 *
 * Uses basic stdin/stdout prompting to avoid adding @inquirer/prompts dependency.
 */
async function promptWizardSelection() {
    // Dynamic import so tests can mock readline
    const readline = await Promise.resolve().then(() => __importStar(require("readline")));
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const ask = (question) => new Promise((resolve) => rl.question(question, resolve));
    console.log("\nOptional extras (all selected by default):\n");
    for (let i = 0; i < exports.WIZARD_CHOICES.length; i++) {
        const c = exports.WIZARD_CHOICES[i];
        console.log(`  [${i + 1}] ${c.label} — ${c.description}`);
    }
    console.log("");
    const answer = await ask("Press Enter to install all, or type numbers to toggle (e.g. 1,3): ");
    rl.close();
    const trimmed = answer.trim();
    if (trimmed === "") {
        return exports.ALL_WIZARD_ITEMS;
    }
    const indices = trimmed
        .split(/[,\s]+/)
        .map((s) => parseInt(s, 10) - 1)
        .filter((i) => i >= 0 && i < exports.WIZARD_CHOICES.length);
    if (indices.length === 0) {
        return exports.ALL_WIZARD_ITEMS;
    }
    return indices.map((i) => exports.WIZARD_CHOICES[i].value);
}
/**
 * Scaffolds selected items into the target directory.
 * Merges with existing files rather than overwriting.
 */
function scaffoldItems(dir, items, opts) {
    const results = [];
    for (const item of items) {
        switch (item) {
            case "hooks":
                results.push(scaffoldHooks(dir, opts));
                break;
            case "skills":
                results.push(scaffoldSkills(dir, opts));
                break;
            case "agents":
                results.push(scaffoldAgents(dir, opts));
                break;
        }
    }
    return results;
}
/**
 * Merges hooks into `.claude/settings.json`.
 * Preserves all existing settings and hooks.
 */
function scaffoldHooks(dir, opts) {
    const settingsPath = path.join(dir, ".claude", "settings.json");
    const claudeDir = path.join(dir, ".claude");
    fs.mkdirSync(claudeDir, { recursive: true });
    let existing = {};
    try {
        const raw = fs.readFileSync(settingsPath, "utf-8");
        existing = JSON.parse(raw);
    }
    catch {
        // File doesn't exist or invalid — start fresh
    }
    const newHooks = (0, index_1.generateHooksTemplate)(opts);
    // Merge hooks: preserve existing hook entries, append new ones
    const existingHooks = (existing.hooks ?? {});
    const mergedHooks = { ...existingHooks };
    for (const [event, hookList] of Object.entries(newHooks)) {
        if (!hookList)
            continue;
        const existingList = mergedHooks[event] ?? [];
        // Only add hooks that aren't already present (compare by command string)
        const existingCommands = new Set(existingList
            .filter((h) => typeof h === "object" && h !== null && "command" in h)
            .map((h) => h.command));
        const newEntries = hookList.filter((h) => !existingCommands.has(h.command));
        mergedHooks[event] = [...existingList, ...newEntries];
    }
    existing.hooks = mergedHooks;
    // Add a marker comment in a metadata field so we can identify m-notes hooks
    if (!existing._mnotes) {
        existing._mnotes = { generatedBy: "m-notes CLI", items: [] };
    }
    const mnotesMetadata = existing._mnotes;
    if (!mnotesMetadata.items.includes("hooks")) {
        mnotesMetadata.items.push("hooks");
    }
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
    return { item: "hooks", filesWritten: [settingsPath] };
}
/**
 * Writes skill files to `.claude/skills/`.
 * Skips files that already exist and contain the m-notes header.
 */
function scaffoldSkills(dir, opts) {
    const skillsDir = path.join(dir, ".claude", "skills");
    fs.mkdirSync(skillsDir, { recursive: true });
    const skills = (0, index_1.generateSkillTemplates)(opts);
    const filesWritten = [];
    for (const skill of skills) {
        const filePath = path.join(skillsDir, skill.filename);
        if (shouldWriteGeneratedFile(filePath)) {
            fs.writeFileSync(filePath, skill.content, "utf-8");
            filesWritten.push(filePath);
        }
    }
    return { item: "skills", filesWritten };
}
/**
 * Writes agent files to `.claude/agents/`.
 * Skips files that already exist and contain the m-notes header.
 */
function scaffoldAgents(dir, opts) {
    const agentsDir = path.join(dir, ".claude", "agents");
    fs.mkdirSync(agentsDir, { recursive: true });
    const agents = (0, index_1.generateAgentTemplates)(opts);
    const filesWritten = [];
    for (const agent of agents) {
        const filePath = path.join(agentsDir, agent.filename);
        if (shouldWriteGeneratedFile(filePath)) {
            fs.writeFileSync(filePath, agent.content, "utf-8");
            filesWritten.push(filePath);
        }
    }
    return { item: "agents", filesWritten };
}
/**
 * Returns true if we should write the generated file.
 * - If file doesn't exist: write it
 * - If file exists and was generated by m-notes: overwrite (update)
 * - If file exists and was NOT generated by m-notes: skip (preserve user's file)
 */
function shouldWriteGeneratedFile(filePath) {
    try {
        const existing = fs.readFileSync(filePath, "utf-8");
        // Only overwrite if it's our generated file
        return existing.includes("Generated by m-notes CLI");
    }
    catch {
        // File doesn't exist — safe to write
        return true;
    }
}
