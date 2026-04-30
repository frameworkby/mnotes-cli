import type { Command } from "commander";
import { printJson } from "../output";

/**
 * Context passed to every action handler. Provides resolved global flags,
 * config, and a hint for whether the user wants JSON output. Action handlers
 * return a plain object (the MCP-shaped JSON); the wrapper either prints it
 * as JSON or hands it to a human-format renderer.
 *
 * Caller restriction: `registerGroup` is intended to be invoked against the
 * root `program` (the one created in `buildProgram`). Nested usage is not
 * supported because we walk up to the root to read global flags like `--json`.
 */
export interface ActionContext {
  /** True when the user passed `--json` on the root program or sub-command. */
  json: boolean;
  /** Global program options as parsed by Commander (api-key, url, etc.). */
  globalOpts: Record<string, unknown>;
}

export interface ActionDescriptor<TInput = Record<string, unknown>, TOutput = unknown> {
  /** Action verb within the group, e.g. `list`, `read`. */
  name: string;
  /** Short human-readable description shown in `--help`. */
  describe: string;
  /**
   * Names of positional arguments in declaration order. Each name is mapped
   * to `input[name]` from Commander's positional values. Use `args` to declare
   * the positionals on the Command itself; `positional` mirrors those names so
   * handlers receive a typed object instead of an opaque `_args` array.
   *
   * Example:
   *   args: (cmd) => cmd.argument("<id>", "Note ID"),
   *   positional: ["id"],
   *   run: async (input) => client.getNote(input.id)
   */
  positional?: string[];
  /** Optional configurator for positional args / options. */
  args?: (cmd: Command) => Command;
  /** Name of the corresponding MCP tool, e.g. `list_notes`. Used by parity. */
  mcpTool: string;
  /**
   * Optional aliases registered as hidden top-level commands so legacy flat
   * commands (e.g. `mnotes list`) keep working after migration.
   */
  aliases?: string[];
  /** Action handler — returns the MCP-shaped JSON payload. */
  run: (input: TInput, ctx: ActionContext) => Promise<TOutput>;
  /** Optional human-readable renderer; falls back to `printJson` when absent. */
  renderHuman?: (output: TOutput) => void;
}

/**
 * In-process registry of every action that has been registered. Used by
 * `mnotes parity` to compare the CLI surface against the MCP manifest without
 * shelling out.
 */
export interface RegisteredAction {
  group: string;
  action: string;
  /** Full command path the user types, e.g. `note list`. */
  commandPath: string;
  mcpTool: string;
  aliases: string[];
}

export const cliRegistry: RegisteredAction[] = [];

/** Walk up Commander's parent chain to find the root program. */
function rootOf(cmd: Command): Command {
  let current: Command = cmd;
  while (current.parent) current = current.parent;
  return current;
}

/**
 * Register a group of related actions under `mnotes <group> <action>` and
 * (optionally) hidden top-level aliases for backward compatibility.
 *
 * Output handling is centralised here: each action returns a plain object,
 * and this wrapper prints JSON when `--json` is passed (on the root program
 * or the sub-command) or delegates to the action's `renderHuman` otherwise.
 *
 * Positional arguments are mapped into the input object by name when an
 * `ActionDescriptor.positional` array is provided, so handlers never need to
 * deal with Commander's variadic argument shape.
 *
 * Re-registration of the same `<group>.<action>` pair is a no-op with a stderr
 * warning. This guards against double-imports during testing where
 * `buildProgram()` may be called more than once.
 */
export function registerGroup(
  program: Command,
  group: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions: ActionDescriptor<any, any>[],
): void {
  const groupCmd = program.command(group).description(`${group} commands`);

  for (const action of actions) {
    const registryKey = `${group}.${action.name}`;
    if (cliRegistry.some((r) => `${r.group}.${r.action}` === registryKey)) {
      process.stderr.write(
        `[registerGroup] skipping duplicate registration: ${registryKey}\n`,
      );
      continue;
    }

    const buildHandler = () => async (
      ...commanderArgs: unknown[]
    ): Promise<void> => {
      // Commander action callback signature: (positionals..., options, command).
      const cmd = commanderArgs[commanderArgs.length - 1] as Command;
      const opts = (cmd.opts() ?? {}) as Record<string, unknown>;
      const positionalValues = commanderArgs.slice(0, -2);

      const input: Record<string, unknown> = { ...opts };
      if (action.positional) {
        action.positional.forEach((name, i) => {
          input[name] = positionalValues[i];
        });
      }

      // Walk to the root program so handlers always see the global `--json`
      // flag regardless of which level Commander parsed it at.
      const root = rootOf(cmd);
      const globalOpts = root.opts();
      const wantsJson = Boolean(globalOpts.json) || Boolean(opts.json);
      const ctx: ActionContext = { json: wantsJson, globalOpts };

      const result = await action.run(input as never, ctx);

      if (ctx.json || !action.renderHuman) {
        printJson(result);
      } else {
        action.renderHuman(result as never);
      }
    };

    const sub = groupCmd
      .command(action.name)
      .description(action.describe);
    if (action.args) action.args(sub);
    sub.action(buildHandler());

    cliRegistry.push({
      group,
      action: action.name,
      commandPath: `${group} ${action.name}`,
      mcpTool: action.mcpTool,
      aliases: action.aliases ?? [],
    });

    for (const alias of action.aliases ?? []) {
      const aliasCmd = program
        .command(alias)
        .description(`Alias for ${group} ${action.name}`);
      (aliasCmd as unknown as { hidden: boolean }).hidden = true;
      if (action.args) action.args(aliasCmd);
      aliasCmd.action(buildHandler());
    }
  }
}
