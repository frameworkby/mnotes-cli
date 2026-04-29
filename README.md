# mnotes-cli

CLI for [m-notes](https://m-notes.app) AI knowledge base. Manage notes, search, and perform CRUD operations from the terminal.

## Install

```bash
npm install -g mnotes-cli
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

### Auditing parity

`mnotes parity` (hidden) prints a table of MCP tools vs CLI commands with
status `present | missing | extra`. Used by the sprint-end audit gate.

## License

Proprietary. See [LICENSE](https://github.com/frameworkby/remedy-pod-m-notes/blob/main/LICENSE).
