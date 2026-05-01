export interface ClaudeCodeTemplateOpts {
  url: string;
  workspaceId: string;
}

export function generateClaudeCodeTemplate(opts: ClaudeCodeTemplateOpts): string {
  return `<!-- m-notes instructions v4 -->
# m-notes — Your Wiki (MANDATORY)

**Server**: ${opts.url}
**Workspace**: ${opts.workspaceId}

> You are not a reader of a scratchpad. You are the **author and maintainer of a living wiki**. Every session, three things compound: the wiki grows, links densify, contradictions get resolved. This is your persistent memory — without it you start from zero every conversation.

## The Three Layers

1. **Raw sources** — user messages, pasted docs, URLs, files. Immutable. You never edit these.
2. **The wiki** — your notes. You *write* these. They are interlinked with \`[[wikilinks]]\`, tagged for retrieval, and updated whenever sources change.
3. **Schema pages** — notes tagged \`type:config\` (or in a \`_schema/\` folder). The user's rules for how the wiki is organized. **Read these before editing the wiki.**

## Rules (follow strictly)

1. **ALWAYS recall before researching.** Before exploring the codebase or making assumptions — run \`mnotes kb recall\` and \`mnotes note search\`. Past you already figured things out.
2. **ALWAYS store what you learn.** Non-obvious discoveries → \`mnotes kb store\` immediately. Anything worth re-finding belongs in the wiki.
3. **ALWAYS log sessions.** Run \`mnotes session log\` before the session ends.
4. **ALWAYS load context at session start.** Run \`mnotes composite project-load\`. Use \`mnotes session resume\` if mid-conversation.
5. **INGEST sources coherently.** When the user drops a URL, long paste, or file: don't just dump it into one note. Run the **ingest loop** (below).
6. **LINT the wiki periodically.** On session start for large workspaces, and after any ingest, run the **lint loop** (below).
7. **READ schema before editing.** Before creating or updating notes, run \`mnotes note search --query type:config\`. Follow their conventions. If none exist, offer to create a starter schema note.
8. **EVERY note must link.** Outbound \`[[wikilinks]]\` are mandatory — an orphan note is invisible.

## Non-Negotiable Checklist

These are not suggestions. Skip any step and the wiki degrades.

### Session Start (before ANY work)
- [ ] Run \`mnotes composite project-load --workspace-id "${opts.workspaceId}"\`
- [ ] Run \`mnotes kb recall --workspace-id "${opts.workspaceId}" --query "<topic>"\` — past you already figured things out
- [ ] Run \`mnotes note search --workspace-id "${opts.workspaceId}" --query "<topic>"\` for related wiki pages
- [ ] If the graph is empty, run \`mnotes graph populate --workspace-id "${opts.workspaceId}"\` (idempotent)
- [ ] Run \`mnotes note search --workspace-id "${opts.workspaceId}" --query "type:config"\` for schema notes before editing

Do not skip this. Do not say "I'll check later." Do not assume you know what's in the wiki.

### During Work (every time you learn something)
- [ ] Non-obvious discovery? → \`mnotes kb store\` immediately, do not batch
- [ ] User drops a URL/paste/file? → run the **ingest loop** (below), not a single note dump
- [ ] Made an architecture or design decision? → store with key \`arch/{component}\`
- [ ] Fixed a bug? → store with key \`bug/{id}\`, include root cause
- [ ] Found a gotcha or footgun? → store with key \`gotcha/{description}\`
- [ ] User corrected you or clarified a requirement? → store it

### What NOT to Store
- Trivial changes (typo fixes, formatting)
- Information obvious from reading the code
- Duplicates — run \`mnotes kb recall\` first to check

### Session End (before finishing)
- [ ] Run \`mnotes session log --workspace-id "${opts.workspaceId}" --summary "..." \`
- [ ] If you did meaningful work and didn't store anything yet — you forgot. Go back and store it.

If you think "this isn't worth saving" — save it anyway. Future you has no context.

## The Ingest Loop

When the user supplies a source (URL, paste, file):

1. **Find related pages**: \`mnotes note search\` + \`mnotes graph query\` to identify 3–15 existing notes affected.
2. **Plan the edits**: which existing notes need \`mnotes note-ops append\` / \`mnotes note update\`, which new notes need \`mnotes note create\`, and what \`[[wikilinks]]\` connect them.
3. **Apply**: execute the plan. Every touched note gets:
   - A \`source/<slug>\` tag or a "Sources" section listing provenance
   - At least one \`[[wikilink]]\` to another touched note
4. **Summarize**: tell the user which notes were created vs. updated.

A single source should rarely touch fewer than 3 notes — that's a sign you're treating the wiki as a dumping ground.

## The Lint Loop

Periodically (session start on large workspaces; after ingests):

- **Contradictions** → run \`mnotes kb scan-conflicts --workspace-id "${opts.workspaceId}"\`. Resolve, don't stack.
- **Orphans** → \`mnotes graph query-note\` for notes with zero inbound or outbound links. Link them or delete.
- **Broken wikilinks** → \`[[X]]\` targets that don't exist. Create a stub note or fix the link.
- **Stale** → notes untouched >90 days referenced by new sources. Update them.

Report findings as a short list; ask before bulk-deleting.

## When to Store Knowledge

Store **proactively** — don't wait to be asked. Categories:
- Architecture decision → \`arch/{component}\`
- Code pattern or convention → \`pattern/{name}\`
- Debugged bug → \`bug/{id}\`
- Dependency quirk → \`dep/{package}\`
- Product/tech decision → \`decision/{topic}\`
- Domain understanding → \`context/{area}\`
- Gotcha or footgun → \`gotcha/{description}\`
- Completed task → \`task/{id}\`

**Promotion rule**: if a knowledge entry is recalled 3+ times, promote it to a full note with \`mnotes note create\` — it has earned a wiki page.

## When to Recall Knowledge

Recall **before acting**:
- Tech decision → recall \`arch/*\` + \`decision/*\`
- Touching a module → recall \`pattern/*\` + \`context/*\`
- Debugging → recall \`bug/*\` for similar past issues
- Adding a dependency → recall \`dep/*\`
- Session start → run \`mnotes composite project-load\` (automatic via SessionStart hook)
- User asks about past work → run \`mnotes session resume\`

## Notes vs. Knowledge Entries

In the wiki model, **notes are primary**. Knowledge entries are fast-capture for things that haven't earned a page yet.

| Use a **note** when... | Use \`mnotes kb store\` when... |
|---|---|
| Content is long-form or evolving | Content is a single fact |
| Needs \`[[wikilinks]]\` and backlinks | Key/tag retrieval is enough |
| Subject will be referenced repeatedly | One-shot capture |
| Meeting notes, investigations, design docs | Architecture decisions, gotchas |

**When in doubt, create a note.**

### Note Creation
- **Meetings / planning** → \`mnotes note create\`
- **Investigations** → \`mnotes note create\` then \`mnotes note-ops append\` as you go
- **Design / architecture** → full notes, not just knowledge entries
- **Task summaries** → after completing a story
- **Daily captures** → \`mnotes note-ops daily\`

### Note Maintenance
- \`mnotes note-ops append\` — add progress
- \`mnotes note update\` — supersede stale content
- \`mnotes tag manage\` — keep notes findable

## Knowledge Graph — Non-Optional

The graph is how the wiki stays navigable. **Every note you write or edit must have at least one outbound wikilink.**

### When to Build
- **Session start**: run \`mnotes graph populate\` if the graph is empty (idempotent).
- **Architecture decisions**: create concept nodes, link with \`related\` / \`parent\`.
- **Dependency discovery**: create nodes for packages, link to components using them.
- **Bug investigations**: link bug nodes to affected components/patterns.
- **Any A↔B relationship**: create the edge. The graph compounds.

### Graph Commands
| Command | When to use |
|---------|------------|
| \`mnotes graph populate --workspace-id <id>\` | Initialize from existing notes (idempotent) |
| \`mnotes graph create-node --workspace-id <id>\` | Add a concept/tag/note-linked node |
| \`mnotes graph create-edge --workspace-id <id>\` | Link two nodes |
| \`mnotes graph query --workspace-id <id>\` | Search by type, label, or connectivity |
| \`mnotes graph neighbors --workspace-id <id>\` | Explore connections from a node |
| \`mnotes graph query-note --workspace-id <id>\` | Get subgraph around a note |

Node types: **note**, **tag**, **concept**. Edge types: **wikilink**, **related**, **parent**, **tagged**, **custom**.

\`\`\`bash
mnotes graph create-node --workspace-id "${opts.workspaceId}" --label "Auth Module" --node-type concept
mnotes graph create-node --workspace-id "${opts.workspaceId}" --label "PostgreSQL" --node-type concept
mnotes graph create-edge --workspace-id "${opts.workspaceId}" --source <authNodeId> --target <pgNodeId> --edge-type related
\`\`\`

## CLI Commands Reference

All commands require \`--workspace-id "${opts.workspaceId}"\` unless noted.

### Session & Context
| Command | When to use |
|---------|------------|
| \`mnotes composite project-load --workspace-id <id>\` | Session start |
| \`mnotes session resume --workspace-id <id>\` | Resume mid-conversation |
| \`mnotes session log --workspace-id <id> --summary "..."\` | Log summary at end |

### Knowledge (fast capture)
| Command | When to use |
|---------|------------|
| \`mnotes kb store --workspace-id <id> --key <key> --content "..."\` | Store a single fact |
| \`mnotes kb recall --workspace-id <id> --query "..."\` | Semantic search |
| \`mnotes bulk knowledge-recall --workspace-id <id> --tag-pattern "arch/*"\` | Recall by tag pattern |
| \`mnotes kb snapshot --workspace-id <id>\` | Export all knowledge |
| \`mnotes kb scan-conflicts --workspace-id <id>\` | Lint: find contradictions |

### Notes (wiki pages)
| Command | When to use |
|---------|------------|
| \`mnotes note create --workspace-id <id> --title "..."\` | New page |
| \`mnotes note update --workspace-id <id> --id <id>\` | Replace content |
| \`mnotes note-ops append --workspace-id <id> --id <id>\` | Add to existing page |
| \`mnotes note get --workspace-id <id> --id <id>\` | Read by ID |
| \`mnotes note-ops by-title --workspace-id <id> --title "..."\` | Read by title |
| \`mnotes note search --workspace-id <id> --query "..."\` | FTS + semantic search |
| \`mnotes note list --workspace-id <id>\` | List by folder |
| \`mnotes note-ops daily --workspace-id <id>\` | Today's capture note |
| \`mnotes tag manage --workspace-id <id> --id <id>\` | Add/remove tags |
| \`mnotes note-ops pin --workspace-id <id> --id <id>\` | Pin a note |
| \`mnotes note-ops star --workspace-id <id> --id <id>\` | Star a note |

### Organization
| Command | When to use |
|---------|------------|
| \`mnotes folder list --workspace-id <id>\` | List folders |
| \`mnotes folder manage --workspace-id <id>\` | Create/rename/delete folders |
| \`mnotes folder move --workspace-id <id>\` | Move a folder |
| \`mnotes bulk move --workspace-id <id>\` | Bulk move notes |
| \`mnotes composite context-fetch --workspace-id <id> --query "..."\` | Search notes by query |

### Knowledge Graph
| Command | When to use |
|---------|------------|
| \`mnotes graph populate --workspace-id <id>\` | Initialize graph |
| \`mnotes graph create-node --workspace-id <id>\` | Add concept node |
| \`mnotes graph create-edge --workspace-id <id>\` | Link two nodes |
| \`mnotes graph query --workspace-id <id>\` | Search graph |
| \`mnotes graph neighbors --workspace-id <id>\` | Explore connections |
| \`mnotes graph query-note --workspace-id <id>\` | Subgraph around a note |`;
}
