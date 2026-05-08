import * as fs from "fs";
import * as path from "path";
import {
  generateHooksTemplate,
  generateHookScripts,
  HOOKS_HEADER,
  getHookScriptsDir,
  generateSkillTemplates,
  generateAgentTemplates,
} from "../../templates/claude-code/index";
import type { ClaudeCodeHooks } from "../../templates/claude-code/index";

/** Items the wizard can scaffold */
export type WizardItem = "hooks" | "skills" | "agents";

export const WIZARD_CHOICES: { value: WizardItem; label: string; description: string }[] = [
  { value: "hooks", label: "Session hooks", description: "Auto-load context on session start" },
  { value: "skills", label: "Skills (/store, /recall)", description: "Slash commands for knowledge management" },
  { value: "agents", label: "Knowledge manager agent", description: "Agent for managing project knowledge" },
];

export const ALL_WIZARD_ITEMS: WizardItem[] = WIZARD_CHOICES.map((c) => c.value);

export interface WizardOpts {
  url: string;
  workspaceId: string;
}

export interface ScaffoldResult {
  item: WizardItem;
  filesWritten: string[];
}

/**
 * Prompts the user to select which extras to install.
 * Returns the selected items. All are selected by default.
 *
 * Uses basic stdin/stdout prompting to avoid adding @inquirer/prompts dependency.
 */
export async function promptWizardSelection(): Promise<WizardItem[]> {
  // Dynamic import so tests can mock readline
  const readline = await import("readline");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (question: string): Promise<string> =>
    new Promise((resolve) => rl.question(question, resolve));

  console.log("\nOptional extras (all selected by default):\n");
  for (let i = 0; i < WIZARD_CHOICES.length; i++) {
    const c = WIZARD_CHOICES[i];
    console.log(`  [${i + 1}] ${c.label} — ${c.description}`);
  }

  console.log("");
  const answer = await ask(
    "Press Enter to install all, or type numbers to toggle (e.g. 1,3): "
  );
  rl.close();

  const trimmed = answer.trim();
  if (trimmed === "") {
    return ALL_WIZARD_ITEMS;
  }

  const indices = trimmed
    .split(/[,\s]+/)
    .map((s) => parseInt(s, 10) - 1)
    .filter((i) => i >= 0 && i < WIZARD_CHOICES.length);

  if (indices.length === 0) {
    return ALL_WIZARD_ITEMS;
  }

  return indices.map((i) => WIZARD_CHOICES[i].value);
}

/**
 * Scaffolds selected items into the target directory.
 * Merges with existing files rather than overwriting.
 */
export function scaffoldItems(
  dir: string,
  items: WizardItem[],
  opts: WizardOpts
): ScaffoldResult[] {
  const results: ScaffoldResult[] = [];

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
 * Merges hooks into `<project>/.claude/settings.json` and writes bash scripts to
 * `~/.claude/hooks/mnotes/scripts/` (user-global, namespaced under `mnotes`).
 * Scripts live globally so they're shared across projects; settings.json stays
 * project-local so each project opts in independently.
 * Preserves all existing settings and hooks.
 */
function scaffoldHooks(dir: string, opts: WizardOpts): ScaffoldResult {
  const settingsPath = path.join(dir, ".claude", "settings.json");
  const claudeDir = path.join(dir, ".claude");

  const hookScriptsDir = getHookScriptsDir();
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.mkdirSync(hookScriptsDir, { recursive: true });

  const filesWritten: string[] = [];

  // 1. Write bash scripts to ~/.claude/hooks/mnotes/scripts/
  const scripts = generateHookScripts(opts);
  for (const script of scripts) {
    const scriptPath = path.join(hookScriptsDir, script.filename);
    fs.writeFileSync(scriptPath, script.content, { mode: 0o755 });
    filesWritten.push(scriptPath);
  }

  // 2. Merge hook entries into settings.json
  let existing: Record<string, unknown> = {};
  try {
    const raw = fs.readFileSync(settingsPath, "utf-8");
    existing = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // File doesn't exist or invalid — start fresh
  }

  const newHooks = generateHooksTemplate(opts);

  // Merge hooks: drop any existing entry that invokes one of OUR scripts (by
  // filename, not exact command — argument shape has changed across CLI
  // versions, e.g. legacy positional workspace-id vs current
  // MNOTES_WORKSPACE_ID env-var prefix). Then append our current entries.
  // Non-m-notes hooks are preserved untouched. Identity = command contains
  // any of our script filenames. (#938)
  const MNOTES_SCRIPT_NAMES = ["mnotes-session-start.sh", "mnotes-session-stop.sh"];
  const isMnotesCommand = (cmd: unknown): boolean =>
    typeof cmd === "string" && MNOTES_SCRIPT_NAMES.some((n) => cmd.includes(n));
  const isMnotesEntry = (entry: unknown): boolean => {
    if (typeof entry !== "object" || entry === null) return false;
    const e = entry as Record<string, unknown>;
    if (Array.isArray(e.hooks)) {
      for (const h of e.hooks) {
        if (typeof h === "object" && h !== null && isMnotesCommand((h as Record<string, unknown>).command)) {
          return true;
        }
      }
    }
    if (isMnotesCommand(e.command)) return true;
    return false;
  };

  const existingHooks = (existing.hooks ?? {}) as Record<string, unknown[]>;
  const mergedHooks: Record<string, unknown[]> = { ...existingHooks };

  for (const [event, hookList] of Object.entries(newHooks)) {
    if (!hookList) continue;
    const existingList = mergedHooks[event] ?? [];
    const preserved = existingList.filter((e) => !isMnotesEntry(e));
    mergedHooks[event] = [...preserved, ...hookList];
  }

  // Strip empty arrays for events we no longer emit but that may still
  // contain only-m-notes entries from previous installs.
  for (const event of Object.keys(mergedHooks)) {
    const list = mergedHooks[event] ?? [];
    const filtered = list.filter((e) => !isMnotesEntry(e));
    const fromUs = (newHooks as Record<string, unknown[] | undefined>)[event] ?? [];
    if (fromUs.length === 0 && filtered.length === 0) {
      delete mergedHooks[event];
    } else if (fromUs.length === 0) {
      mergedHooks[event] = filtered;
    }
  }

  existing.hooks = mergedHooks;

  // Add a marker comment in a metadata field so we can identify m-notes hooks
  if (!existing._mnotes) {
    existing._mnotes = { generatedBy: "m-notes CLI", items: [] };
  }
  const mnotesMetadata = existing._mnotes as { generatedBy: string; items: string[] };
  if (!mnotesMetadata.items.includes("hooks")) {
    mnotesMetadata.items.push("hooks");
  }

  fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
  filesWritten.push(settingsPath);

  return { item: "hooks", filesWritten };
}

/**
 * Writes skill files to `.claude/skills/`.
 * Skips files that already exist and contain the m-notes header.
 */
function scaffoldSkills(dir: string, opts: WizardOpts): ScaffoldResult {
  const skillsDir = path.join(dir, ".claude", "skills");
  fs.mkdirSync(skillsDir, { recursive: true });

  const skills = generateSkillTemplates(opts);
  const filesWritten: string[] = [];

  for (const skill of skills) {
    const filePath = path.join(skillsDir, skill.path);
    if (shouldWriteGeneratedFile(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
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
function scaffoldAgents(dir: string, opts: WizardOpts): ScaffoldResult {
  const agentsDir = path.join(dir, ".claude", "agents");
  fs.mkdirSync(agentsDir, { recursive: true });

  const agents = generateAgentTemplates(opts);
  const filesWritten: string[] = [];

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
function shouldWriteGeneratedFile(filePath: string): boolean {
  try {
    const existing = fs.readFileSync(filePath, "utf-8");
    // Only overwrite if it's our generated file
    return existing.includes("Generated by m-notes CLI");
  } catch {
    // File doesn't exist — safe to write
    return true;
  }
}
