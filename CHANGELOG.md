# mnotes-cli changelog

All notable changes to the CLI are documented here. The CLI follows semver
independent of the app — see `feedback_release_versioning` in agent memory.

## 1.14.0 — 2026-04-29

### Added
- Command-group scaffolding: `registerGroup` helper + `<group>/<action>.ts`
  layout. New `mnotes note list` is the reference migration.
- Shared Zod schemas under `src/parity/schemas/` enforce that CLI `--json`
  output and the matching MCP tool response satisfy the same shape.
- Hidden `mnotes parity` command joins the MCP manifest against the in-process
  CLI registry and prints `present | missing | extra` per tool.
- Parity test harness at `src/__tests__/parity/` with a reference fixture for
  `list_notes`.
- `zod` runtime dependency.

### Changed
- `mnotes list --json` top-level shape is now `{ notes, nextCursor }` (was
  `{ data, nextCursor }`) to match the MCP `list_notes` tool response. The
  legacy flat command `mnotes list` continues to work as a hidden alias of
  `mnotes note list`; only the JSON envelope key was renamed.

### Notes for downstream consumers
If you parse `mnotes list --json`, rename `result.data` to `result.notes`.
The legacy key will not be re-added — alignment with MCP is the contract.
