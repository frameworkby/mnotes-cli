import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { listWorkspacesAction } from "./list";
import { createWorkspaceAction } from "./create";
import { selectWorkspaceAction } from "./select";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import { readConfig, writeConfig } from "../login";
import * as readline from "readline";

function ask(rl: readline.Interface, q: string): Promise<string> {
  return new Promise((resolve) => rl.question(q, (a) => resolve(a.trim())));
}

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

function removeDirectoryMapping(dir: string): boolean {
  const stored = readConfig();
  if (!stored?.workspaces?.[dir]) return false;
  delete stored.workspaces[dir];
  writeConfig(stored);
  return true;
}

export function registerWorkspaceGroup(program: Command): void {
  registerGroup(program, "workspace", [
    listWorkspacesAction,
    createWorkspaceAction,
    selectWorkspaceAction,
  ]);

  // Attach legacy local-config commands to the workspace group. These do not
  // map to MCP tools and stay outside the parity registry on purpose — they
  // manage *client-side* directory/global mappings, not server state.
  const ws = program.commands.find((c: Command) => c.name() === "workspace");
  if (!ws) return;

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
        console.log("No workspaces found. Create one with: mnotes workspace create --name <name>");
        return;
      }

      const cwd = process.cwd();
      let selected: typeof workspaces[0] | undefined;

      if (workspaceIdOrSlug) {
        selected = workspaces.find(
          (w) => w.id === workspaceIdOrSlug || w.slug === workspaceIdOrSlug,
        );
        if (!selected) {
          process.stderr.write(`Error: workspace "${workspaceIdOrSlug}" not found.\n`);
          process.exit(1);
        }
      } else {
        const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
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
      console.log(`Linked ${cwd} -> ${selected.name} [${selected.slug}]`);
    });

  ws.command("unlink")
    .description("Remove workspace mapping for current directory")
    .action(() => {
      const cwd = process.cwd();
      const removed = removeDirectoryMapping(cwd);
      console.log(removed ? `Unlinked ${cwd}` : `No workspace linked to ${cwd}`);
    });

  ws.command("current")
    .description("Show workspace for current directory")
    .action(async () => {
      const stored = readConfig();
      const cwd = process.cwd();
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
    .description("Show all directory -> workspace mappings")
    .action(() => {
      const stored = readConfig();
      const workspaces = stored?.workspaces;
      if (!workspaces || Object.keys(workspaces).length === 0) {
        console.log("No directory mappings. Use: mnotes workspace link");
        return;
      }
      for (const [dir, wsId] of Object.entries(workspaces)) {
        console.log(`  ${dir} -> ${wsId}`);
      }
      if (stored?.workspaceId) {
        console.log(`\n  Global default: ${stored.workspaceId}`);
      }
    });
}
