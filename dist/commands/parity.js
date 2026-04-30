"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerParityCommand = registerParityCommand;
const _register_group_1 = require("./_register-group");
const mcp_manifest_json_1 = __importDefault(require("../parity/mcp-manifest.json"));
// The manifest is a top-level array (T-3 contract). Cast through unknown to
// avoid coupling to the deeply-typed JSON inference TypeScript generates.
const manifestTools = mcp_manifest_json_1.default;
/**
 * `mnotes parity` (hidden) — joins the MCP manifest with the in-process CLI
 * registry and prints a status table. Used by Story 7's audit gate.
 *
 * Status semantics:
 *   present — manifest tool has a CLI command bound to it.
 *   missing — manifest lists the tool but no CLI command claims it.
 *   extra   — CLI command claims an MCP tool that is not in the manifest.
 *
 * `drift` is reserved for cross-shape mismatches detected by the parity test
 * harness; this command only does manifest×registry presence joins.
 */
function registerParityCommand(program) {
    program
        .command("parity", { hidden: true })
        .description("Audit CLI ⇄ MCP tool parity")
        .option("--json", "Emit JSON instead of a table")
        .action((opts, cmd) => {
        // Honor `--json` whether the user passed it on the root program
        // (`mnotes --json parity`) or the sub-command (`mnotes parity --json`).
        let root = cmd;
        while (root.parent)
            root = root.parent;
        const rootJson = Boolean(root.opts().json);
        const wantsJson = Boolean(opts.json) || rootJson;
        const tools = manifestTools;
        const rows = [];
        for (const t of tools) {
            const match = _register_group_1.cliRegistry.find((r) => r.mcpTool === t.tool);
            rows.push({
                tool: t.tool,
                command: match ? match.commandPath : "—",
                status: match ? "present" : "missing",
            });
        }
        for (const reg of _register_group_1.cliRegistry) {
            if (!tools.some((t) => t.tool === reg.mcpTool)) {
                rows.push({
                    tool: reg.mcpTool,
                    command: reg.commandPath,
                    status: "extra",
                });
            }
        }
        if (wantsJson) {
            console.log(JSON.stringify({ rows }, null, 2));
            return;
        }
        const toolW = Math.max(4, ...rows.map((r) => r.tool.length));
        const cmdW = Math.max(7, ...rows.map((r) => r.command.length));
        console.log(`${"TOOL".padEnd(toolW)}  ${"COMMAND".padEnd(cmdW)}  STATUS`);
        for (const row of rows) {
            console.log(`${row.tool.padEnd(toolW)}  ${row.command.padEnd(cmdW)}  ${row.status}`);
        }
        const missing = rows.filter((r) => r.status === "missing").length;
        const extra = rows.filter((r) => r.status === "extra").length;
        console.log("");
        console.log(`${rows.length} entries — ${rows.length - missing - extra} present, ${missing} missing, ${extra} extra`);
    });
}
