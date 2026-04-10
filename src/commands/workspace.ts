import { Command } from "commander";
import * as readline from "readline";
import { resolveConfig } from "../config";
import { createClient } from "../client";
import { readConfig, writeConfig } from "./login";

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function workspaceList(program: Command): Promise<void> {
  const globalOpts = program.opts();
  const config = resolveConfig(globalOpts);
  const client = createClient(config.baseUrl, config.apiKey);

  const res = await client.listWorkspaces();
  const workspaces = res.data;

  if (workspaces.length === 0) {
    console.log("No workspaces found. Create one with: mnotes workspace create <name>");
    return;
  }

  const stored = readConfig();
  const selectedId = stored?.workspaceId;

  for (const w of workspaces) {
    const markers: string[] = [];
    if (w.isDefault) markers.push("default");
    if (w.id === selectedId) markers.push("selected");
    const suffix = markers.length > 0 ? `  (${markers.join(", ")})` : "";
    console.log(`  ${w.name} [${w.slug}]${suffix}`);
  }
}

async function workspaceSelect(program: Command): Promise<void> {
  const globalOpts = program.opts();
  const config = resolveConfig(globalOpts);
  const client = createClient(config.baseUrl, config.apiKey);

  const res = await client.listWorkspaces();
  const workspaces = res.data;

  if (workspaces.length === 0) {
    console.log("No workspaces found. Create one with: mnotes workspace create <name>");
    return;
  }

  const stored = readConfig();
  const selectedId = stored?.workspaceId;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  try {
    process.stderr.write("\nWorkspaces:\n");
    for (let i = 0; i < workspaces.length; i++) {
      const w = workspaces[i]!;
      const marker = w.id === selectedId ? " *" : "";
      process.stderr.write(`  ${i + 1}. ${w.name} [${w.slug}]${marker}\n`);
    }

    const answer = await ask(rl, `\nSelect workspace [1-${workspaces.length}]: `);
    const choice = parseInt(answer, 10);

    if (choice < 1 || choice > workspaces.length || isNaN(choice)) {
      process.stderr.write("Invalid selection.\n");
      process.exit(1);
    }

    const selected = workspaces[choice - 1]!;

    const existing = stored ?? { apiKey: config.apiKey, serverUrl: config.baseUrl };
    writeConfig({ ...existing, workspaceId: selected.id });

    console.log(`Selected workspace: ${selected.name} [${selected.slug}]`);
  } finally {
    rl.close();
  }
}

async function workspaceCreate(program: Command, name: string): Promise<void> {
  const globalOpts = program.opts();
  const config = resolveConfig(globalOpts);
  const client = createClient(config.baseUrl, config.apiKey);

  const res = await client.createWorkspace(name);
  console.log(`Created workspace: ${res.data.name} [${res.data.slug}]`);

  const stored = readConfig();
  if (!stored?.workspaceId) {
    const existing = stored ?? { apiKey: config.apiKey, serverUrl: config.baseUrl };
    writeConfig({ ...existing, workspaceId: res.data.id });
    console.log("Auto-selected as default workspace.");
  }
}

async function workspaceCurrent(program: Command): Promise<void> {
  const stored = readConfig();
  if (stored?.workspaceId) {
    const config = resolveConfig(program.opts());
    const client = createClient(config.baseUrl, config.apiKey);
    try {
      const res = await client.listWorkspaces();
      const current = res.data.find((w) => w.id === stored.workspaceId);
      if (current) {
        console.log(`Current workspace: ${current.name} [${current.slug}]`);
      } else {
        console.log(`Current workspace ID: ${stored.workspaceId} (not found on server)`);
      }
    } catch {
      console.log(`Current workspace ID: ${stored.workspaceId}`);
    }
  } else {
    console.log("No workspace selected. Run: mnotes workspace select");
  }
}

export function registerWorkspaceCommand(program: Command): void {
  program
    .command("workspace [action] [name]")
    .description("Manage workspaces (list | select | create <name> | current)")
    .action(async (action?: string, name?: string) => {
      switch (action) {
        case "list":
          await workspaceList(program);
          break;
        case "select":
          await workspaceSelect(program);
          break;
        case "create":
          if (!name) {
            process.stderr.write("Error: workspace name required. Usage: mnotes workspace create <name>\n");
            process.exit(1);
          }
          await workspaceCreate(program, name);
          break;
        case "current":
          await workspaceCurrent(program);
          break;
        case undefined:
          await workspaceCurrent(program);
          break;
        default:
          process.stderr.write(`Unknown action: ${action}\nUsage: mnotes workspace [list | select | create <name> | current]\n`);
          process.exit(1);
      }
    });
}
