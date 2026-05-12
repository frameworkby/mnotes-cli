import { Command } from "commander";
import { registerGroup } from "../_register-group";
import { lintAction } from "./lint";
import { indexRefreshAction } from "./index-refresh";
import { logAppendAction } from "./log-append";
import { logTailAction } from "./log-tail";
import { printJson } from "../../output";
import { cliRegistry } from "../_register-group";
import type { ActionDescriptor, ActionContext } from "../_register-group";

/**
 * Wire a single ActionDescriptor onto an already-created Commander sub-command.
 * Mirrors the inner loop of registerGroup but accepts an existing Command node
 * rather than creating a new one under a group — needed for the two-level
 * `wiki index refresh` / `wiki log append|tail` hierarchy.
 */
function attachLeaf<TInput, TOutput>(
  parentCmd: Command,
  groupPath: string,
  action: ActionDescriptor<TInput, TOutput>,
): void {
  const registryKey = `${groupPath}.${action.name}`;
  if (cliRegistry.some((r) => `${r.group}.${r.action}` === registryKey)) {
    process.stderr.write(
      `[registerGroup] skipping duplicate registration: ${registryKey}\n`,
    );
    return;
  }

  const buildHandler = () =>
    async (...commanderArgs: unknown[]): Promise<void> => {
      const cmd = commanderArgs[commanderArgs.length - 1] as Command;
      const opts = (cmd.opts() ?? {}) as Record<string, unknown>;
      const positionalValues = commanderArgs.slice(0, -2);

      const input: Record<string, unknown> = { ...opts };
      if (action.positional) {
        action.positional.forEach((name, i) => {
          input[name] = positionalValues[i];
        });
      }

      let current: Command = cmd;
      while (current.parent) current = current.parent;
      const root = current;
      const globalOpts = root.opts();
      const wantsJson = Boolean(globalOpts.json) || Boolean(opts.json);
      const ctx: ActionContext = { json: wantsJson, globalOpts };

      const result = await action.run(input as never, ctx);

      if (ctx.json || !action.renderHuman) {
        printJson(result);
      } else {
        action.renderHuman(result as never, input as never);
      }
    };

  const leaf = parentCmd.command(action.name).description(action.describe);
  if (action.args) action.args(leaf);
  leaf.action(buildHandler());

  cliRegistry.push({
    group: groupPath,
    action: action.name,
    commandPath: `${groupPath} ${action.name}`,
    mcpTool: action.mcpTool,
    aliases: action.aliases ?? [],
  });
}

export function registerWikiGroup(program: Command): void {
  // `wiki lint` — single-level, use the existing helper
  registerGroup(program, "wiki", [lintAction]);

  // Retrieve the `wiki` Command node that registerGroup just created so we can
  // hang sub-commands off it without re-creating it.
  const wikiCmd = program.commands.find((c) => c.name() === "wiki");
  if (!wikiCmd) {
    throw new Error("[registerWikiGroup] could not find 'wiki' command after registerGroup");
  }

  // `wiki index refresh`
  const indexCmd = wikiCmd.command("index").description("Wiki index commands");
  attachLeaf(indexCmd, "wiki index", indexRefreshAction);

  // `wiki log append|tail`
  const logCmd = wikiCmd.command("log").description("Wiki log commands");
  attachLeaf(logCmd, "wiki log", logAppendAction);
  attachLeaf(logCmd, "wiki log", logTailAction);
}
