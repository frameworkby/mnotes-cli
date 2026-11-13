# mnotes-cli changelog

All notable changes to the CLI are documented here. The CLI follows semver
independent of the app — see `feedback_release_versioning` in agent memory.

## 5.0.0 — 2026-11-13

### Add

`mnotes board` — commands for the built-in task tracker (the kanban board at
`/kanban`, independent of note tags and of markdown-checkbox `mnotes task`):
`list [--status a,b] [--assignee] [--q] [--limit]`, `create <title>`,
`show <id>`, `update <id>`, `move <id> <status>`, `comment <id> <body>`,
`delete <id>`. Statuses: `backlog`, `todo`, `in_progress` (`in-progress`
accepted), `review`, `done`. Writes from the CLI show up as agent activity on
the task. Needs the app release that ships `/api/v1/board/tasks`.

Query commands show related board tasks: `mnotes search`, `mnotes note
search` and `mnotes kb recall` end with a `Related tasks:` footer (tasks
linked to a result note, or whose title/description contains the query);
`--json` output of all query commands includes `relatedTasks`. `kb recall`
writes its human-mode footer to stderr. Older servers: no footer,
`relatedTasks: []`.

**Breaking:** `mnotes search --json` and `mnotes kb recall --json` now print
`{ "results": [...], "relatedTasks": [...] }` instead of a bare results array.
Scripts that parsed the array should read `.results`.

## 4.9.0 — 2026-11-05

### Add

- `mnotes kb feedback`: rates a `kb ask` answer up or down. Ratings nudge which
  notes rank first in later answers (at most ±15%), and re-rating replaces the
  previous rating. `kb ask --json` now includes `answerId` (null when nothing
  was retrieved). Needs an app release with frameworkby/mnotes#1138.

```sh
mnotes kb feedback <answerId> --rating up [--comment "..."]
mnotes kb feedback <answerId> --rating clear
```

`--json` prints the server payload unchanged:
`{ "data": { "answerId", "rating": 1 | -1 | null, "notesUpdated" } }`.

## 4.8.0 — 2026-11-04

### Add

- `mnotes kb supersede`: marks a knowledge entry as superseded by a newer one,
  so `kb recall` and `kb ask` stop returning it. Needs an app release with
  frameworkby/mnotes#1137.

```sh
mnotes kb supersede --key db.engine --by db.engine.v2   # or --id / --by-id
mnotes kb supersede --key db.engine --clear             # restore it
```

`--json` prints the server's `data` unchanged:
`{ noteId, key, title, supersededById, supersededBy: { id, key, title } | null, resolvedConflicts }`.

## 4.7.0 — 2026-11-04

### Add

- `mnotes kb ask --context-only`: returns the retrieved notes without calling
  the server's LLM, for agents that reason over the notes themselves. Needs an
  app release with frameworkby/mnotes#1142; older servers ignore the flag and
  answer as before.

`--json` shape (all new fields are additive):

```jsonc
{
  "answer": "string | null",          // null only with --context-only
  "contextOnly": true,                // only with --context-only
  "context": "### [1] Title (chunk 1/3, score: 0.81)\n…",  // only with --context-only
  "confidence": 0.82,
  "sources": [{ "noteId": "…", "title": "…", "excerpt": "≤200 chars", "relevanceScore": 0.81, "chunkIndex": 0, "totalChunks": 3 }],
  "evidence": {
    "chunks": [{ "id": "noteId#0", "noteId": "…", "chunkIndex": 0, "score": 0.81 }],
    "nodes": [{ "id": "graphNodeId", "noteId": "…", "label": "…" }]
  }
}
```

`evidence.chunks[].id` is `noteId#chunkIndex` and is not stable across note
edits yet (stable ids come with frameworkby/mnotes#1141). `evidence.nodes`
lists the graph node of each source note that has one.

## 4.6.1 — 2026-11-04

### Security

- Removed the unused `zod` dependency (high advisory GHSA for oversized collections). The CLI now has no vulnerable production dependencies.
- Dev: vitest 4.1.12; `npm audit` reports 0 vulnerabilities.

## 4.6.0 — 2026-11-03

### Add

`mnotes code` — query the repo's code graph build (a graphify import) from
agents and the terminal. All commands take `--json` and `--build <name|id>`;
the build otherwise comes from `MNOTES_CODE_BUILD`, then the build named
after the git top-level (or cwd) basename (looked up with `?name=`). A
`--build` value is matched as a name first, then as an id.

- `mnotes code status`: the build, `repoRoot`, short `head`, commits
  `behind`, `stale` (HEAD moved past the build commit, or the commit is
  unknown locally) and `dirty` (tracked files modified; doesn't make the
  build stale).
- `mnotes code search <query> [--type <t>] [--limit <n>]`
- `mnotes code show <node-id|query> [--limit <n>]`: location, snippet,
  incoming/outgoing edges grouped by type and linked notes; a non-id falls
  back to the top search hit.
- `mnotes code impact <file|symbol> [--depth <n>] [--limit <n>]`: reverse
  dependencies grouped by file; files on disk are sent as repo-relative POSIX
  paths. A file the build doesn't know yet returns no dependents with
  `notInGraph: true` (exit 0) instead of failing.
- `mnotes code refresh [--if-stale] [--exclude <glob>]...`: runs
  `graphify extract . --code-only` and imports it in-process (name, `--root`,
  `--commit`, `--replace`). `--if-stale` is a no-op when the build is fresh
  and never creates a first build.

Needs the app release with the `/api/v1/graph/builds/:id/{search,nodes,impact}`
endpoints. Codex/OpenClaw instructions (v8) now point agents at `mnotes code`.

## 4.5.0 — 2026-11-02

### Add

`mnotes graph import <file> --root <repo>` now reads each code node's
`source_file` under `--root` and attaches a `snippet` (up to 20 lines /
1500 chars from the node's start line) so the build inspector can show the
code. Skips non-code nodes, missing / binary / > 1 MB files and paths that
resolve outside the root; total snippet payload is capped at 8 MB (one-line
warning when hit). Opt out with `--no-snippets`. Needs the app release that
renders snippets; older servers store the field but don't show it.

## 4.2.0 — 2026-05-19

### Add

`--folder <id>` is now accepted as an alias for `--folder-id <id>` on the
commands that previously only took the long form: `mnotes create`,
`mnotes note create`, and `mnotes kb ingest-external`. `--folder-id` remains
canonical and is listed first in `--help`. When both flags are supplied,
`--folder-id` wins.

Closes [mnotes-cli#1](https://github.com/frameworkby/mnotes-cli/issues/1).

## 4.1.1 — 2026-05-15

### Fix

Sanitize the `X-Mnotes-Session-Label` (and `X-Mnotes-Session-Id`) header value
so it never crashes Node's `fetch` with `Cannot convert argument to a
ByteString`. CLI args drive the session label, and any non-Latin-1 character
(em-dash, smart quote, emoji, …) would previously break every outgoing
request. Non-ASCII chars are now replaced with `?` before being sent.

## 4.0.0 — 2026-05-12 (#976)

### Breaking change

`mnotes connect claude-code` is removed. Invoking it prints a redirect to the
Claude Code plugin and exits 1. Claude Code integration is now handled by
the plugin (`frameworkby/mnotes-claude-plugin`), which ships hooks, skills,
and the `knowledge-manager` sub-agent as a managed unit.

**Migration:**
```
/plugin marketplace add frameworkby/mnotes-claude-plugin
/plugin install mnotes@mnotes
# Then run /mnotes:setup inside Claude Code
```

Clean up old scaffolded files if you previously ran `mnotes connect claude-code`:
```bash
rm -rf .claude/skills/mnotes-store .claude/skills/mnotes-recall .claude/agents/knowledge-manager.md
rm -rf ~/.claude/hooks/mnotes/
# Also remove 'mnotes-*.sh' hook entries from .claude/settings.json
```

Full guide: https://github.com/frameworkby/remedy-pod-m-notes/blob/main/docs/claude-code-plugin.md

`mnotes connect codex` and `mnotes connect openclaw` are unaffected.

## 2.0.0 — 2026-05-06

### Breaking change

`--workspace-id` and `--workspace` flags have been removed from every command.

**Before (v1.x):**
```bash
mnotes note search --query "auth" --workspace-id ws_abc123
mnotes kb store --key arch/db --content "..." --workspace-id ws_abc123
```

**After (v2.x):**
```bash
mnotes note search --query "auth"
mnotes kb store --key arch/db --content "..."
```

Workspace is now resolved automatically in this order:

1. `MNOTES_WORKSPACE_ID` environment variable
2. Per-directory mapping set by `mnotes workspace link` (walks up parent dirs)
3. Global default set by `mnotes workspace select`

**Migration:**

| Old approach | New approach |
|---|---|
| `--workspace-id ws_abc123` per command | `export MNOTES_WORKSPACE_ID=ws_abc123` in shell profile |
| One-off per script | `mnotes workspace link` in the project directory |
| Global default | `mnotes workspace select` (interactive) |

If no workspace is resolvable, commands exit with:
```
No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.
```

### Changed
- `resolveConfig()` — `workspaceId` field removed from options type; workspace always resolved internally via env/config cascade.
- Generated `CLAUDE.md` (from `mnotes connect claude-code`) no longer includes `--workspace-id` in any command examples. Added a "Workspace Resolution" section explaining the cascade.
- Generated session hook scripts (`mnotes-session-start.sh`, `mnotes-session-stop.sh`) no longer accept a workspace ID positional argument. The hook command in `settings.json` now exports `MNOTES_WORKSPACE_ID=<id>` as an env var prefix instead.
- `docs/cli-reference.md` updated throughout — all examples rewritten without `--workspace-id`.

## 1.20.0 — 2026-04-30

### Added
- `mnotes session save-conversation --messages <json>` (`save_conversation`) — persist an AI chat transcript as a new note.
- `mnotes note-ops` group — 20 per-note actions matching the remaining MCP note tools:
  - State: `archive`, `pin`, `unpin`, `star` (use `--no-starred` to unstar)
  - Editing: `append`, `frontmatter-get`, `frontmatter-set`, `set-type`
  - Versioning: `versions`, `restore-version`
  - Lookup: `by-title`, `batch`, `pinned`, `starred`, `stale`, `orphan`, `duplicates`
  - Daily: `daily`, `daily-digest`
  - AI: `note-summary`
- `mnotes tag` group — `list`, `manage` (rename/merge/delete), `extract` (AI entity extraction)
- `mnotes ws` group — extended workspace ops: `context`, `role`, `update`, `delete`, `setup`, `team`
- `mnotes info` group — `version` (server version) and `instructions` (`generate_agent_instructions`)
- `mnotes composite` group — `context-fetch` and `project-load` for token-budgeted hybrid retrieval

### Parity audit
Sprint 53 exit gate: 103/104 MCP tools surfaced (96 in registered groups, 7 via legacy flat commands). Only `set_active_workspace` is excluded — the HTTP API is stateless. See `docs/implementation/reviews/sprint-53-parity-audit.md` for the full table.

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
