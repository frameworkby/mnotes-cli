# mnotes-cli changelog

All notable changes to the CLI are documented here. The CLI follows semver
independent of the app — see `feedback_release_versioning` in agent memory.

## 1.19.0 — 2026-04-30

### Added
- `mnotes note-ext` group — 7 subcommands matching MCP per-note AI/annotation tools:
  - `note-ext suggest-tags <id>` (`suggest_tags`) — top-5 frequent tags from semantically similar notes
  - `note-ext suggest-tags-links <id>` (`suggest_tags_links`) — AI tag + wikilink suggestions
  - `note-ext set-importance <id> --importance <n>` (`set_importance`) — set 0-1 retrieval weight
  - `note-ext set-provenance <id> --source <type> --ref <text>` (`set_provenance`) — append a provenance entry
  - `note-ext get-provenance <id>` (`get_provenance`) — read the provenance chain
  - `note-ext split <id>` (`split_note`) — AI-driven split proposal
  - `note-ext synthesize --note-ids <csv>` (`synthesize_notes`) — synthesise 2-20 notes into a new note
- `mnotes recipe` group — 2 subcommands matching MCP recipe tools:
  - `recipe list` (`list_recipes`)
  - `recipe run <id> --note-id <id>` (`run_recipe`)
- `mnotes object-type` group — 2 subcommands matching MCP supertag tools:
  - `object-type list` (`list_object_types`)
  - `object-type query <type>` (`query_by_type`) — optional `--property-filters <json>` and `--limit`
- `mnotes bulk` group — 4 subcommands matching MCP bulk tools:
  - `bulk archive --note-ids <csv>` (`bulk_archive`)
  - `bulk move --note-ids <csv> --target-folder-id <id>` (`bulk_move`)
  - `bulk tag --note-ids <csv> --tags <csv> --op <add|remove>` (`bulk_tag`)
  - `bulk knowledge-recall --queries <csv>` (`bulk_knowledge_recall`)

## 1.18.0 — 2026-04-30

### Added
- `mnotes session` group — 4 subcommands matching MCP session tools:
  - `session list` (`list_sessions`) — paginated session traces (limit, cursor)
  - `session log` (`session_log`) — append a session summary with decisions/actions
  - `session replay <id>` (`get_session_replay`) — fetch a single trace
  - `session resume` (`session_context_resume`) — restore decisions/actions/notes from the most recent (or given) session
- `mnotes cluster` group — 1 subcommand:
  - `cluster get` (`get_clusters`) — cached k-means clusters of notes
- `mnotes timeline` group — 1 subcommand:
  - `timeline list` (`list_timeline`) — notes by creation date with optional `--from`/`--to`/`--limit`
- `mnotes moc` group — 1 subcommand:
  - `moc generate --scope-type folder|tag --scope-id <id>` (`generate_moc`)
- `mnotes smart-folder` group — 3 subcommands:
  - `smart-folder list` (`list_smart_folders`)
  - `smart-folder create --name --query --mode fulltext|semantic` (`create_smart_folder`)
  - `smart-folder delete <id>` (`delete_smart_folder`)
- `mnotes task` group — 2 subcommands:
  - `task list` (`list_tasks`) — extract markdown checkboxes; filter by status/tag/note
  - `task toggle --note-id --task-index <n> [--done|--not-done]` (`toggle_task`)

## 1.17.0 — 2026-04-30

### Added
- `mnotes graph` group — 14 subcommands matching MCP graph tools:
  - `graph get` (`get_graph`) — workspace graph with optional label/type filters
  - `graph neighbors --node-id <id>` (`get_neighbors`) — BFS neighbors of a node
  - `graph traverse --start-node-id <id>` (`graph_traverse`) — recursive traversal with edge/node-type filters
  - `graph find-path --from-node-id <id> --to-node-id <id>` (`find_path`) — shortest path between two nodes
  - `graph query` (`query_graph`) — advanced query (node/edge type, label substring, connected-to expansion)
  - `graph query-note --note-id <id>` (`query_note_graph`) — local graph around a note
  - `graph populate` (`populate_graph`) — sync nodes/edges from notes/wikilinks
  - `graph related <id>` (`related_notes`) — semantic neighbors via embeddings
  - `graph backlinks <id>` (`get_backlinks`) — incoming wikilinks
  - `graph links <id>` (`get_note_links`) — outgoing + incoming wikilinks
  - `graph create-node` (`create_node`) — create note/tag/concept node
  - `graph delete-node <id>` (`delete_node`) — delete a node and its edges
  - `graph create-edge --source-id <id> --target-id <id>` (`create_edge`)
  - `graph delete-edge <id>` (`delete_edge`)

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
- `extract_entities` deferred to #760.
- Legacy `mnotes recall-knowledge` still works via hidden alias on `kb recall`.

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
