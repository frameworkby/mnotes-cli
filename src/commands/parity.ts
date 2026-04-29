import type { Command } from "commander";
import { cliRegistry } from "./_register-group";
import rawManifest from "../parity/mcp-manifest.json";

interface ManifestTool {
  /** MCP tool name. */
  tool: string;
  description?: string;
  inputSchema?: unknown;
}

// The manifest is a top-level array (T-3 contract). Cast through unknown to
// avoid coupling to the deeply-typed JSON inference TypeScript generates.
const manifestTools: ManifestTool[] = rawManifest as unknown as ManifestTool[];

// TODO(story-7): drift detection via output schema diffing.
type ParityStatus = "present" | "missing" | "extra";

interface ParityRow {
  tool: string;
  command: string;
  status: ParityStatus;
}

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
export function registerParityCommand(program: Command): void {
  program
    .command("parity", { hidden: true })
    .description("Audit CLI ⇄ MCP tool parity")
    .option("--json", "Emit JSON instead of a table")
    .action((opts: { json?: boolean }, cmd: Command) => {
      // Honor `--json` whether the user passed it on the root program
      // (`mnotes --json parity`) or the sub-command (`mnotes parity --json`).
      let root: Command = cmd;
      while (root.parent) root = root.parent;
      const rootJson = Boolean((root.opts() as { json?: boolean }).json);
      const wantsJson = Boolean(opts.json) || rootJson;

      const tools = manifestTools;
      const rows: ParityRow[] = [];

      for (const t of tools) {
        const match = cliRegistry.find((r) => r.mcpTool === t.tool);
        rows.push({
          tool: t.tool,
          command: match ? match.commandPath : "—",
          status: match ? "present" : "missing",
        });
      }

      for (const reg of cliRegistry) {
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

      console.log(
        `${"TOOL".padEnd(toolW)}  ${"COMMAND".padEnd(cmdW)}  STATUS`,
      );
      for (const row of rows) {
        console.log(
          `${row.tool.padEnd(toolW)}  ${row.command.padEnd(cmdW)}  ${row.status}`,
        );
      }

      const missing = rows.filter((r) => r.status === "missing").length;
      const extra = rows.filter((r) => r.status === "extra").length;
      console.log("");
      console.log(
        `${rows.length} entries — ${rows.length - missing - extra} present, ${missing} missing, ${extra} extra`,
      );
    });
}
