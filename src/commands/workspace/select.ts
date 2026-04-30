import type { Command } from "commander";
import * as readline from "readline";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import { readConfig, writeConfig } from "../login";
import { printSuccess } from "../../output";
import type { ActionDescriptor } from "../_register-group";

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

interface SelectInput {
  id?: string;
  global?: boolean;
}

interface SelectOutput {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
}

/**
 * `workspace select` — sets the server-side default workspace for the user
 * (PATCH /api/v1/workspaces/:id with { isDefault: true }).
 *
 * Behaviour matrix:
 *   <id> given            → server-side default flip (parity with MCP set_active_workspace)
 *   no id, --global       → interactive picker, persists to global config (legacy)
 *   no id, no flag        → interactive picker, persists per-directory mapping (legacy)
 */
export const selectWorkspaceAction: ActionDescriptor<SelectInput, SelectOutput> = {
  name: "select",
  describe: "Set the active (default) workspace",
  mcpTool: "set_active_workspace",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("[id]", "Workspace ID or slug")
      .option("--global", "Set as global default in CLI config (no server change)"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);

    // ── Fast path: positional id provided → server-side default flip ──────
    if (input.id) {
      // Resolve slug → id if needed.
      let workspaceId = input.id;
      const list = await client.listWorkspaces();
      const found = list.data.find(
        (w) => w.id === input.id || w.slug === input.id,
      );
      if (!found) {
        process.stderr.write(`Error: workspace "${input.id}" not found.\n`);
        process.exit(1);
      }
      workspaceId = found.id;

      const res = await client.setActiveWorkspace(workspaceId);
      return res.data;
    }

    // ── Legacy interactive picker ─────────────────────────────────────────
    const list = await client.listWorkspaces();
    const workspaces = list.data;
    if (workspaces.length === 0) {
      process.stderr.write(
        "No workspaces found. Create one with: mnotes workspace create --name <name>\n",
      );
      process.exit(1);
    }

    const stored = readConfig();
    const cwd = process.cwd();
    const currentId = stored?.workspaces?.[cwd] || stored?.workspaceId;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    let selected;
    try {
      process.stderr.write("\nWorkspaces:\n");
      for (let i = 0; i < workspaces.length; i++) {
        const w = workspaces[i]!;
        const marker = w.id === currentId ? " *" : "";
        process.stderr.write(
          `  ${i + 1}. ${w.name} [${w.slug}]${marker}\n`,
        );
      }
      const answer = await ask(
        rl,
        `\nSelect workspace [1-${workspaces.length}]: `,
      );
      const choice = parseInt(answer, 10);
      if (choice < 1 || choice > workspaces.length || isNaN(choice)) {
        process.stderr.write("Invalid selection.\n");
        process.exit(1);
      }
      selected = workspaces[choice - 1]!;
    } finally {
      rl.close();
    }

    if (input.global) {
      const existing = stored ?? { apiKey: config.apiKey, serverUrl: config.baseUrl };
      writeConfig({ ...existing, workspaceId: selected.id });
    } else {
      const existing = stored ?? { apiKey: config.apiKey, serverUrl: config.baseUrl };
      const workspacesMap = existing.workspaces ?? {};
      workspacesMap[cwd] = selected.id;
      writeConfig({ ...existing, workspaces: workspacesMap });
    }

    return selected;
  },

  renderHuman: (output) => {
    printSuccess(`Active workspace: ${output.name} [${output.slug}]`);
  },
};
