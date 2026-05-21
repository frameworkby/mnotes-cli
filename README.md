# mnotes-cli

CLI for [m-notes](https://m-notes.app) AI knowledge base. Manage notes, search, and perform CRUD operations from the terminal.

Runs on Windows 10+, macOS 12+, and Linux. Node 20.19+ required.

## Install

```bash
npm install -g mnotes-cli
```

### Windows

Prerequisites: Node 20.19 or newer. Node 18 was dropped in Sprint 58 due to the vitest 4 dependency.

Install globally from PowerShell or `cmd.exe`:

```powershell
npm install -g mnotes-cli
```

Authenticate:

```powershell
mnotes login
```

`mnotes login` opens your default browser and supports both Microsoft Edge and Google Chrome.

The CLI config is written to `%USERPROFILE%\.mnotes\config.json`. Note that POSIX mode bits (chmod 0o600) do not apply on Windows; the config file is created without restrictive POSIX permissions. Ensure your user profile is not shared with other local accounts.

Workspace linking uses Windows path resolution and can be run from any directory:

```powershell
mnotes workspace link
```

## Setup

Set your API key and (optionally) the server URL:

```bash
export MNOTES_API_KEY="your-api-key"
export MNOTES_URL="https://mnotes.framework.by"  # defaults to http://localhost:3000
```

Or pass them as flags:

```bash
mnotes --api-key <key> --url <url> <command>
```

## Commands

| Command | Description |
|---------|-------------|
| `mnotes note list` | List notes (legacy `mnotes list` aliased) |
| `mnotes read <id>` | Read a note |
| `mnotes search <query>` | Search notes (fulltext or semantic) |
| `mnotes create` | Create a note |
| `mnotes update <id>` | Update a note |
| `mnotes delete <id>` | Delete a note |
| `mnotes folder list` | List folders with hierarchy + note counts |
| `mnotes folder summary` | High-level workspace overview (totals, tree, recent, tags) |
| `mnotes folder manage --action <create\|rename\|delete>` | Folder lifecycle (mirrors MCP `manage_folders`) |
| `mnotes folder recent --since <iso>` | Notes modified since a timestamp |
| `mnotes folder search-tags --tags <a,b>` | Find notes matching given tags (`--match any\|all`) |
| `mnotes folder move <id> --parent-id <id> \| --root` | Re-parent a folder |
| `mnotes file upload --path <p> --mime-type <t>` | Upload an image or PDF; optional `--note-id` to embed |
| `mnotes kb <action>` | Knowledge-base ops: `recall`, `store`, `memory`, `ingest`, `decay`, `archive`, `consolidate`, `snapshot`, `ask`, `link`, `scan-conflicts`, `conflicts`, `stats` |
| `mnotes graph <action>` | Graph: `get`, `neighbors`, `traverse`, `find-path`, `query`, `query-note`, `populate`, `related`, `backlinks`, `links`, `create-node`, `delete-node`, `create-edge`, `delete-edge` |
| `mnotes session <action>` | Sessions: `list`, `log`, `replay`, `resume`, `save-conversation` |
| `mnotes cluster get` | KMeans cluster layout for the note graph |
| `mnotes timeline list` | Time-bucketed activity timeline |
| `mnotes moc generate` | Generate a Map-of-Content note for a folder or tag |
| `mnotes smart-folder <action>` | `list`, `create`, `delete` saved searches |
| `mnotes task <action>` | `list` and `toggle` tasks parsed from notes |
| `mnotes note-ext <action>` | AI per-note: `suggest-tags`, `suggest-tags-links`, `set-importance`, `set-provenance`, `get-provenance`, `split`, `synthesize` |
| `mnotes recipe <action>` | `list` and `run` recipes |
| `mnotes object-type <action>` | `list` and `query` notes by object type |
| `mnotes bulk <action>` | Bulk: `archive`, `move`, `tag`, `knowledge-recall` |
| `mnotes note-ops <action>` | Per-note ops: `append`, `archive`, `pin`, `unpin`, `star`, `frontmatter-get`, `frontmatter-set`, `set-type`, `versions`, `restore-version`, `by-title`, `batch`, `pinned`, `starred`, `stale`, `orphan`, `duplicates`, `daily`, `daily-digest`, `note-summary` |
| `mnotes tag <action>` | Tags: `list`, `manage`, `extract` |
| `mnotes ws <action>` | Workspaces (extended): `context`, `role`, `update`, `delete`, `setup`, `team` |
| `mnotes info <action>` | `version`, `instructions` (generate AI-client setup) |
| `mnotes composite <action>` | Composite tools: `context-fetch`, `project-load` |

### Options

- `--api-key <key>` API key (or `MNOTES_API_KEY` env var)
- `--url <url>` Base URL (or `MNOTES_URL` env var)
- `--json` Output as JSON
- `--help` Show help
- `--version` Show version

### Examples

```bash
# List all notes
mnotes list

# Search notes semantically
mnotes search "machine learning" --mode semantic

# Create a note
mnotes create --title "Meeting Notes" --content "# Agenda\n- Item 1"

# Read a specific note as JSON
mnotes read abc123 --json

# Delete a note
mnotes delete abc123
```

## JSON output contract

The CLI is designed so AI agents can swap MCP transport for CLI invocations
without rewriting downstream parsing. To make this safe, every command that
mirrors an MCP tool emits JSON with a top-level shape that matches the MCP
tool's response.

### The rule

For each `mnotes <group> <action> --json` that has a corresponding MCP tool:

- The **top-level keys must match** the MCP tool response (same names, same
  nesting). Per-item field names within arrays must match too.
- Extra fields on individual items are allowed — schemas are `passthrough` —
  but envelopes (`{ notes, nextCursor }`, etc.) are strict.
- The CLI is the consumer of HTTP APIs; if the API shape diverges from MCP,
  the CLI reshapes inside the action handler, not the server.

### Where the contract lives

Shared Zod schemas at `src/parity/schemas/<tool>.ts`. Both the live CLI output
and a recorded MCP fixture must `parse` cleanly against the same schema. The
test harness at `src/__tests__/parity/parity.test.ts` enforces this.

### Reference

`mnotes note list --json` mirrors MCP `list_notes`:

```json
{
  "notes": [
    { "id": "…", "title": "…", "folderId": "…", "type": "note", "updatedAt": "…" }
  ],
  "nextCursor": null
}
```

> **Migration note (v1.14.0)**: the legacy `mnotes list --json` previously
> returned `{ data, nextCursor }`. It now returns `{ notes, nextCursor }` to
> match MCP. The CLI command path also moved to `mnotes note list`; the flat
> form is preserved as a hidden alias.

### Aliases

When a flat command (`mnotes list`) is migrated into a group (`mnotes note
list`), the flat form is registered as a hidden top-level alias that
delegates to the same handler. No deprecation warnings are emitted in v1.x —
the aliases are stable through the next major release.

### Migration note (v2.1.0) — `connect claude` and `connect cursor` removed

`mnotes connect claude` and `mnotes connect cursor` have been removed. Both targets wrote a dead `${url}/api/mcp` URL into `~/.claude/mcp.json` and `~/.cursor/mcp.json` respectively — the m-notes MCP endpoint no longer exists. If you previously ran either removed command, delete the stale `m-notes` entry from `~/.claude/mcp.json` or `~/.cursor/mcp.json` to avoid connection errors in your AI client.

### Migration note — `connect claude-code` removed

`mnotes connect claude-code` has been removed. Claude Code integration is now handled by the Claude Code plugin, which ships hooks, skills, and the `knowledge-manager` sub-agent as a managed unit. See the [Claude Code Plugin guide](../../docs/claude-code-plugin.md) for install and migration instructions. `mnotes connect codex` and `mnotes connect openclaw` are unaffected.

### Auditing parity

`mnotes parity` (hidden) prints a table of MCP tools vs CLI commands with
status `present | missing | extra`. Used by the sprint-end audit gate.

## License

Proprietary. See [LICENSE](https://github.com/frameworkby/remedy-pod-m-notes/blob/main/LICENSE).
