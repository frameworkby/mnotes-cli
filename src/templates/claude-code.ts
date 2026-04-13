export interface ClaudeCodeTemplateOpts {
  url: string;
  workspaceId: string;
}

export function generateClaudeCodeTemplate(opts: ClaudeCodeTemplateOpts): string {
  return `<!-- m-notes instructions v3 -->
# m-notes — Your Wiki (MANDATORY)

**Server**: ${opts.url}
**Workspace**: ${opts.workspaceId}

> You are not a reader of a scratchpad. You are the **author and maintainer of a living wiki**. Every session, three things compound: the wiki grows, links densify, contradictions get resolved. This is your persistent memory — without it you start from zero every conversation.

## The Three Layers

1. **Raw sources** — user messages, pasted docs, URLs, files. Immutable. You never edit these.
2. **The wiki** — your notes. You *write* these. They are interlinked with \`[[wikilinks]]\`, tagged for retrieval, and updated whenever sources change.
3. **Schema pages** — notes tagged \`type:config\` (or in a \`_schema/\` folder). The user's rules for how the wiki is organized. **Read these before editing the wiki.**

## Rules (follow strictly)

1. **ALWAYS recall before researching.** Before exploring the codebase or making assumptions — call \`recall_knowledge\` and \`search_notes\`. Past you already figured things out.
2. **ALWAYS store what you learn.** Non-obvious discoveries → \`knowledge_store\` immediately. Anything worth re-finding belongs in the wiki.
3. **ALWAYS log sessions.** Call \`session_log\` before the session ends.
4. **ALWAYS load context at session start.** Call \`project_context_load\`. Use \`session_context_resume\` if mid-conversation.
5. **INGEST sources coherently.** When the user drops a URL, long paste, or file: don't just dump it into one note. Run the **ingest loop** (below).
6. **LINT the wiki periodically.** On session start for large workspaces, and after any ingest, run the **lint loop** (below).
7. **READ schema before editing.** Before creating or updating notes, call \`search_notes\` for \`type:config\` notes. Follow their conventions. If none exist, offer to create a starter schema note.
8. **EVERY note must link.** Outbound \`[[wikilinks]]\` are mandatory — an orphan note is invisible.

## The Ingest Loop

When the user supplies a source (URL, paste, file):

1. **Find related pages**: \`search_notes\` + \`query_graph\` to identify 3–15 existing notes affected.
2. **Plan the edits**: which existing notes need \`append_to_note\` / \`update_note\`, which new notes need \`create_note\`, and what \`[[wikilinks]]\` connect them.
3. **Apply**: execute the plan. Every touched note gets:
   - A \`source/<slug>\` tag or a "Sources" section listing provenance
   - At least one \`[[wikilink]]\` to another touched note
4. **Summarize**: tell the user which notes were created vs. updated.

A single source should rarely touch fewer than 3 notes — that's a sign you're treating the wiki as a dumping ground.

## The Lint Loop

Periodically (session start on large workspaces; after ingests):

- **Contradictions** → call \`scan_knowledge_conflicts\`. Resolve, don't stack.
- **Orphans** → \`query_note_graph\` for notes with zero inbound or outbound links. Link them or delete.
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

**Promotion rule**: if a knowledge entry is recalled 3+ times, promote it to a full note with \`create_note\` — it has earned a wiki page.

## When to Recall Knowledge

Recall **before acting**:
- Tech decision → \`arch/*\` + \`decision/*\`
- Touching a module → relevant \`pattern/*\` + \`context/*\`
- Debugging → \`bug/*\` for similar past issues
- Adding a dependency → \`dep/*\`
- Session start → \`project_context_load\` (automatic via SessionStart hook)
- User asks about past work → \`session_context_resume\`

## Notes vs. Knowledge Entries

In the wiki model, **notes are primary**. Knowledge entries are fast-capture for things that haven't earned a page yet.

| Use a **note** when... | Use \`knowledge_store\` when... |
|---|---|
| Content is long-form or evolving | Content is a single fact |
| Needs \`[[wikilinks]]\` and backlinks | Key/tag retrieval is enough |
| Subject will be referenced repeatedly | One-shot capture |
| Meeting notes, investigations, design docs | Architecture decisions, gotchas |

**When in doubt, create a note.**

### Note Creation
- **Meetings / planning** → \`create_note\`
- **Investigations** → \`create_note\` then \`append_to_note\` as you go
- **Design / architecture** → full notes, not just knowledge entries
- **Task summaries** → after completing a story
- **Daily captures** → \`daily_note\`

### Note Maintenance
- \`append_to_note\` — add progress
- \`update_note\` — supersede stale content
- \`manage_tags\` / folder tools — keep notes findable

## Knowledge Graph — Non-Optional

The graph is how the wiki stays navigable. **Every note you write or edit must have at least one outbound wikilink.**

### When to Build
- **Session start**: call \`populate_graph\` if the graph is empty (idempotent).
- **Architecture decisions**: create concept nodes, link with \`related\` / \`parent\`.
- **Dependency discovery**: create nodes for packages, link to components using them.
- **Bug investigations**: link bug nodes to affected components/patterns.
- **Any A↔B relationship**: create the edge. The graph compounds.

### Graph Tools
| Tool | When to use |
|------|------------|
| \`populate_graph\` | Initialize from existing notes (idempotent) |
| \`create_node\` | Add a concept/tag/note-linked node |
| \`create_edge\` | Link two nodes (wikilink, related, parent, tagged, custom) |
| \`query_graph\` | Search by type, label, or connectivity |
| \`get_neighbors\` | Explore connections from a node |
| \`query_note_graph\` | Get subgraph around a note |

Node types: **note**, **tag**, **concept**. Edge types: **wikilink**, **related**, **parent**, **tagged**, **custom**.

\`\`\`
create_node({ label: "Auth Module", nodeType: "concept", workspaceId: "${opts.workspaceId}" })
create_node({ label: "PostgreSQL", nodeType: "concept", workspaceId: "${opts.workspaceId}" })
create_edge({ sourceId: authNodeId, targetId: pgNodeId, edgeType: "related", workspaceId: "${opts.workspaceId}" })
\`\`\`

## MCP Tools Reference

### Session & Context
| Tool | When to use |
|------|------------|
| \`project_context_load\` | Session start |
| \`session_context_resume\` | Resume mid-conversation |
| \`session_log\` | Log summary at end |

### Knowledge (fast capture)
| Tool | When to use |
|------|------------|
| \`knowledge_store\` | Store a single fact |
| \`recall_knowledge\` | Semantic search |
| \`bulk_knowledge_recall\` | Recall by tag pattern (e.g., \`arch/*\`) |
| \`knowledge_snapshot\` | Export all knowledge |
| \`scan_knowledge_conflicts\` | Lint: find contradictions |

### Notes (wiki pages)
| Tool | When to use |
|------|------------|
| \`create_note\` | New page |
| \`update_note\` | Replace content |
| \`append_to_note\` | Add to existing page |
| \`get_note\` / \`get_note_by_title\` | Read |
| \`search_notes\` | FTS + semantic search |
| \`list_notes\` | List by folder |
| \`daily_note\` | Today's capture note |
| \`manage_tags\` | Add/remove tags |
| \`pin_note\` / \`toggle_star\` | Elevate importance |

### Organization
| Tool | When to use |
|------|------------|
| \`list_folders\` / \`manage_folders\` / \`move_folder\` / \`bulk_move\` | Folder + note-move ops |
| \`context_fetch\` | Search notes by query |

### Knowledge Graph
| Tool | When to use |
|------|------------|
| \`populate_graph\` | Initialize graph |
| \`create_node\` / \`create_edge\` | Build structure |
| \`query_graph\` / \`get_neighbors\` / \`query_note_graph\` | Explore |

All tools require \`workspaceId: "${opts.workspaceId}"\`.`;
}
