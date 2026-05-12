import type { Command } from "commander";
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
    /** Optional human-readable renderer; falls back to `printJson` when absent.
     * The framework always passes `input` so renderers can gate output on flags
     * without leaking CLI state into the JSON/MCP payload.  Existing renderers
     * that ignore the second arg keep working. */
    renderHuman?: (output: TOutput, input?: TInput) => void;
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
export declare const cliRegistry: RegisteredAction[];
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
export declare function registerGroup(program: Command, group: string, actions: ActionDescriptor<any, any>[]): void;
