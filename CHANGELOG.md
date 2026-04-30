# mnotes-cli changelog

All notable changes to the CLI are documented here. The CLI follows semver
independent of the app — see `feedback_release_versioning` in agent memory.

## 1.16.0 — 2026-04-30

### Added
- `mnotes kb` group — 13 subcommands matching MCP knowledge tools:
  - `kb recall` (`recall_knowledge`) — also keeps hidden aliases
    `recall-knowledge` / `recall_knowledge` for backward compat with the legacy
    flat command, which has been removed from top-level registration.
  - `kb store` (`knowledge_store`)
  - `kb memory` (`memory_upsert`)
  - `kb ingest` (`knowledge_ingest`)
  - `kb decay` (`knowledge_decay`)
  - `kb archive` (`archive_stale_memories`)
  - `kb consolidate --strategy merge|summarize` (`consolidate_memories`)
  - `kb snapshot --format json|markdown` (`knowledge_snapshot`)
  - `kb ask --question <q>` (`ask_notes`)
  - `kb link --relation-type ...` (`knowledge_link`)
  - `kb scan-conflicts` (`scan_knowledge_conflicts`)
  - `kb conflicts` (`get_knowledge_conflicts`)
  - `kb stats` (`get_kb_stats`)

### Notes for downstream consumers
- `extract_entities` is intentionally deferred to a follow-up story (#760) and
  is not part of this release.
- The legacy top-level `mnotes recall-knowledge` keeps working through hidden
  aliases on `kb recall`; prefer the namespaced form going forward.

## 1.15.0 — 2026-04-29

### Added
- `mnotes folder` group — six subcommands matching MCP `folder-tools.ts`:
  - `folder list` (`list_folders`)
  - `folder summary` (`get_workspace_summary`)
  - `folder manage --action create|rename|delete` (`manage_folders`)
  - `folder recent --since <iso>` (`get_recent_notes`)
  - `folder search-tags --tags <csv>` (`search_by_tags`)
  - `folder move <id> --parent-id <id> | --root` (`move_folder`)
- `mnotes file upload` — mirrors MCP `upload_file`. Accepts `--path` (file is
  read and base64-encoded for you) or `--content` (already-encoded base64).
- Shared Zod schemas + parity fixtures for all seven tools under
  `src/parity/schemas/` and `src/__tests__/parity/fixtures/`.
- `parity.test.ts` refactored to iterate `<tool, schema, fixture, commandPath>`
  cases; one test row per tool covering schema, registry binding, and manifest
  presence.

### Notes for downstream consumers
- `get_recent_notes` and `search_by_tags` live in `folder-tools.ts` MCP-side
  even though they return notes. To match the MCP grouping (parity contract),
  the CLI mounts them under `mnotes folder` (`folder recent`,
  `folder search-tags`). Underlying API path is `/api/v1/notes/...`.
- `manage_folders` is action-overloaded (create/rename/delete); the CLI keeps
  the 1:1 parity contract with one command (`folder manage --action ...`)
  rather than splitting into three commands.
- DELETE on a folder containing notes returns HTTP 409. The CLI surfaces this
  as a non-zero exit with the server's error message; parity is structural and
  defined on the success-case shape (`{ deleted: id }`).

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
