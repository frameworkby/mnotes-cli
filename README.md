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
| `mnotes list` | List notes |
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

## License

Proprietary. See [LICENSE](https://github.com/frameworkby/remedy-pod-m-notes/blob/main/LICENSE).
