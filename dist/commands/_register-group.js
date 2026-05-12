"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cliRegistry = void 0;
exports.registerGroup = registerGroup;
const output_1 = require("../output");
exports.cliRegistry = [];
/** Walk up Commander's parent chain to find the root program. */
function rootOf(cmd) {
    let current = cmd;
    while (current.parent)
        current = current.parent;
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
function registerGroup(program, group, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
actions) {
    const groupCmd = program.command(group).description(`${group} commands`);
    for (const action of actions) {
        const registryKey = `${group}.${action.name}`;
        if (exports.cliRegistry.some((r) => `${r.group}.${r.action}` === registryKey)) {
            process.stderr.write(`[registerGroup] skipping duplicate registration: ${registryKey}\n`);
            continue;
        }
        const buildHandler = () => async (...commanderArgs) => {
            // Commander action callback signature: (positionals..., options, command).
            const cmd = commanderArgs[commanderArgs.length - 1];
            const opts = (cmd.opts() ?? {});
            const positionalValues = commanderArgs.slice(0, -2);
            const input = { ...opts };
            if (action.positional) {
                action.positional.forEach((name, i) => {
                    // Only let a positional overwrite an option value when the positional
                    // was actually supplied. This allows `--id <id>` to act as an alias
                    // for a positional that was declared optional (`[id]`).
                    const positionalValue = positionalValues[i];
                    if (positionalValue !== undefined) {
                        input[name] = positionalValue;
                    }
                });
            }
            // Walk to the root program so handlers always see the global `--json`
            // flag regardless of which level Commander parsed it at.
            const root = rootOf(cmd);
            const globalOpts = root.opts();
            const wantsJson = Boolean(globalOpts.json) || Boolean(opts.json);
            const ctx = { json: wantsJson, globalOpts };
            const result = await action.run(input, ctx);
            if (ctx.json || !action.renderHuman) {
                (0, output_1.printJson)(result);
            }
            else {
                action.renderHuman(result, input);
            }
        };
        const sub = groupCmd
            .command(action.name)
            .description(action.describe);
        if (action.args)
            action.args(sub);
        sub.action(buildHandler());
        exports.cliRegistry.push({
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
            aliasCmd.hidden = true;
            if (action.args)
                action.args(aliasCmd);
            aliasCmd.action(buildHandler());
        }
    }
}
