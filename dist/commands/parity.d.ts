import type { Command } from "commander";
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
export declare function registerParityCommand(program: Command): void;
