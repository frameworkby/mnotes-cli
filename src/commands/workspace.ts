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

/** Save a directory → workspace mapping in config. */
function saveDirectoryMapping(dir: string, workspaceId: string): void {
  const stored = readConfig();
  if (!stored) {
    process.stderr.write("Error: not logged in. Run `mnotes login` first.\n");
    process.exit(1);
  }
  const workspaces = stored.workspaces ?? {};
  workspaces[dir] = workspaceId;
  writeConfig({ ...stored, workspaces });
}

/** Remove a directory → workspace mapping from config. */
function removeDirectoryMapping(dir: string): boolean {
  const stored = readConfig();
  if (!stored?.workspaces?.[dir]) return false;
  delete stored.workspaces[dir];
  writeConfig(stored);
  return true;
}

export function registerWorkspaceCommand(program: Command): void {
  const ws = program
    .command("workspace")
    .description("Manage workspaces");

  ws.command("list")
    .description("List all workspaces")
    .action(async () => {
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
      const cwd = process.cwd();
      const dirMapped = stored?.workspaces?.[cwd];
      const globalDefault = stored?.workspaceId;

      for (const w of workspaces) {
        const markers: string[] = [];
        if (w.isDefault) markers.push("default");
        if (w.id === dirMapped) markers.push("linked");
        else if (w.id === globalDefault) markers.push("global");
        const suffix = markers.length > 0 ? `  (${markers.join(", ")})` : "";
        console.log(`  ${w.name} [${w.slug}]${suffix}`);
      }
    });

  ws.command("select")
    .description("Select workspace for current directory (saved to config)")
    .option("--global", "Set as global default instead of per-directory")
    .action(async (opts: { global?: boolean }) => {
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
      const cwd = process.cwd();
      const currentId = stored?.workspaces?.[cwd] || stored?.workspaceId;

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stderr,
      });

      try {
        process.stderr.write("\nWorkspaces:\n");
        for (let i = 0; i < workspaces.length; i++) {
          const w = workspaces[i]!;
          const marker = w.id === currentId ? " *" : "";
          process.stderr.write(`  ${i + 1}. ${w.name} [${w.slug}]${marker}\n`);
        }

        const answer = await ask(rl, `\nSelect workspace [1-${workspaces.length}]: `);
        const choice = parseInt(answer, 10);

        if (choice < 1 || choice > workspaces.length || isNaN(choice)) {
          process.stderr.write("Invalid selection.\n");
          process.exit(1);
        }

        const selected = workspaces[choice - 1]!;

        if (opts.global) {
          const existing = stored ?? { apiKey: config.apiKey, serverUrl: config.baseUrl };
          writeConfig({ ...existing, workspaceId: selected.id });
          console.log(`Global default workspace: ${selected.name} [${selected.slug}]`);
        } else {
          saveDirectoryMapping(cwd, selected.id);
          console.log(`Linked ${cwd} → ${selected.name} [${selected.slug}]`);
        }
      } finally {
        rl.close();
      }
    });

  ws.command("link")
    .description("Link current directory to a workspace")
    .argument("[workspace-id]", "Workspace ID or slug (interactive if omitted)")
    .action(async (workspaceIdOrSlug?: string) => {
      const globalOpts = program.opts();
      const config = resolveConfig(globalOpts);
      const client = createClient(config.baseUrl, config.apiKey);

      const res = await client.listWorkspaces();
      const workspaces = res.data;

      if (workspaces.length === 0) {
        console.log("No workspaces found. Create one with: mnotes workspace create <name>");
        return;
      }

      const cwd = process.cwd();
      let selected: typeof workspaces[0] | undefined;

      if (workspaceIdOrSlug) {
        selected = workspaces.find(
          (w) => w.id === workspaceIdOrSlug || w.slug === workspaceIdOrSlug
        );
        if (!selected) {
          process.stderr.write(`Error: workspace "${workspaceIdOrSlug}" not found.\n`);
          process.exit(1);
        }
      } else {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stderr,
        });
        try {
          process.stderr.write("\nWorkspaces:\n");
          for (let i = 0; i < workspaces.length; i++) {
            const w = workspaces[i]!;
            process.stderr.write(`  ${i + 1}. ${w.name} [${w.slug}]\n`);
          }
          const answer = await ask(rl, `\nLink to workspace [1-${workspaces.length}]: `);
          const choice = parseInt(answer, 10);
          if (choice < 1 || choice > workspaces.length || isNaN(choice)) {
            process.stderr.write("Invalid selection.\n");
            process.exit(1);
          }
          selected = workspaces[choice - 1]!;
        } finally {
          rl.close();
        }
      }

      saveDirectoryMapping(cwd, selected.id);
      console.log(`Linked ${cwd} → ${selected.name} [${selected.slug}]`);
    });

  ws.command("unlink")
    .description("Remove workspace mapping for current directory")
    .action(async () => {
      const cwd = process.cwd();
      const removed = removeDirectoryMapping(cwd);
      if (removed) {
        console.log(`Unlinked ${cwd}`);
      } else {
        console.log(`No workspace linked to ${cwd}`);
      }
    });

  ws.command("create")
    .description("Create a new workspace")
    .argument("<name>", "Workspace name")
    .action(async (name: string) => {
      const globalOpts = program.opts();
      const config = resolveConfig(globalOpts);
      const client = createClient(config.baseUrl, config.apiKey);

      const res = await client.createWorkspace(name);
      console.log(`Created workspace: ${res.data.name} [${res.data.slug}]`);

      // Auto-link to current directory
      const cwd = process.cwd();
      saveDirectoryMapping(cwd, res.data.id);
      console.log(`Linked ${cwd} → ${res.data.name}`);
    });

  ws.command("current")
    .description("Show workspace for current directory")
    .action(async () => {
      const stored = readConfig();
      const cwd = process.cwd();

      // Check directory mapping first
      const dirMapped = stored?.workspaces?.[cwd];
      const effectiveId = dirMapped || stored?.workspaceId;
      const source = dirMapped ? "linked" : stored?.workspaceId ? "global" : null;

      if (!effectiveId) {
        console.log(`No workspace for ${cwd}`);
        console.log("Run: mnotes workspace select");
        return;
      }

      const config = resolveConfig(program.opts());
      const client = createClient(config.baseUrl, config.apiKey);
      try {
        const res = await client.listWorkspaces();
        const current = res.data.find((w) => w.id === effectiveId);
        if (current) {
          console.log(`${current.name} [${current.slug}] (${source})`);
        } else {
          console.log(`${effectiveId} (${source}, not found on server)`);
        }
      } catch {
        console.log(`${effectiveId} (${source})`);
      }
    });

  ws.command("mappings")
    .description("Show all directory → workspace mappings")
    .action(async () => {
      const stored = readConfig();
      const workspaces = stored?.workspaces;

      if (!workspaces || Object.keys(workspaces).length === 0) {
        console.log("No directory mappings. Use: mnotes workspace link");
        return;
      }

      for (const [dir, wsId] of Object.entries(workspaces)) {
        console.log(`  ${dir} → ${wsId}`);
      }

      if (stored?.workspaceId) {
        console.log(`\n  Global default: ${stored.workspaceId}`);
      }
    });
}
