export interface ClaudeCodeTemplateOpts {
  url: string;
  workspaceId: string;
}

export function generateClaudeCodeTemplate(opts: ClaudeCodeTemplateOpts): string {
  return `# m-notes — Persistent Knowledge Base (MANDATORY)

**Server**: ${opts.url}
**Workspace**: ${opts.workspaceId}

> **IMPORTANT**: You MUST use m-notes tools throughout every session. This is your persistent memory across sessions — without it you start from zero every time. The instructions below are NOT optional.

## Rules (follow strictly)

1. **ALWAYS recall before researching.** Before exploring the codebase, reading files, or making assumptions about architecture — call \`recall_knowledge\` first. Past you already figured things out; don't waste tokens rediscovering them.
2. **ALWAYS store what you learn.** When you discover something non-obvious (architecture decisions, gotchas, patterns, bug root causes, dependency quirks) — store it immediately with \`knowledge_store\`. If it took effort to figure out, it's worth storing.
3. **ALWAYS log sessions.** Before the session ends, call \`session_log\` with a summary of what was accomplished, decisions made, and next steps. Future sessions depend on this.
4. **ALWAYS load context at session start.** Call \`project_context_load\` at the beginning of every session. The SessionStart hook does this automatically, but if you're resuming mid-conversation, call \`session_context_resume\`.

## When to Store Knowledge

Store knowledge **proactively** — don't wait for the user to ask. Store when you:
- Make or discover an architecture decision → \`arch/{component}\`
- Find a code pattern or convention → \`pattern/{name}\`
- Debug and fix a bug → \`bug/{id-or-description}\`
- Learn something about a dependency → \`dep/{package}\`
- Make a product or tech decision → \`decision/{topic}\`
- Build understanding of a domain area → \`context/{area}\`
- Discover a gotcha or footgun → \`gotcha/{description}\`
- Complete a task or story → \`task/{id}\`

## When to Recall Knowledge

Recall knowledge **before acting**. Specifically:
- Before making a tech decision → recall \`arch/*\` and \`decision/*\`
- Before touching a module → recall relevant \`pattern/*\` and \`context/*\`
- Before debugging → recall \`bug/*\` for similar past issues
- Before adding a dependency → recall \`dep/*\`
- At session start → \`project_context_load\` loads everything relevant
- When the user asks about past work → \`session_context_resume\`

## Notes — Your Working Documents

m-notes is not just a knowledge base — it's a full note-taking system. **Use notes actively** to create and maintain living documents:

### When to Create Notes
- **Meeting notes** → \`create_note\` after any planning discussion or decision
- **Investigation logs** → create a note when debugging, append findings as you go with \`append_to_note\`
- **Design docs** → write architecture or design decisions as full notes, not just knowledge entries
- **Task summaries** → after completing a story/task, create a note summarizing what was done
- **Checklists and plans** → create notes with markdown checklists for multi-step work
- **Daily notes** → use \`daily_note\` to create/get today's note for quick captures

### When to Edit Notes
- **Append progress** → use \`append_to_note\` to add to existing notes as work progresses
- **Update docs** → when code changes invalidate existing notes, update them with \`update_note\`
- **Tag and organize** → use \`manage_tags\` and folder tools to keep notes findable

### Note vs Knowledge Entry
| Use a **note** when... | Use **knowledge_store** when... |
|---|---|
| Content is long-form (paragraphs, lists, docs) | Content is a single fact or decision |
| Document will be updated over time | Entry is a permanent record |
| Needs folder organization | Needs key/tag retrieval |
| Meeting notes, plans, investigations | Architecture decisions, gotchas, patterns |

**When in doubt, create a note.** Notes are searchable, linkable, and visible in the UI.

## Knowledge Graph — Build Structured Memory

Beyond flat knowledge entries, you have a **knowledge graph** for structured relationships between concepts. Use it to map how things connect — architecture components, dependencies, decisions, and patterns.

### When to Build the Graph
- **Session start**: If the graph is empty, call \`populate_graph\` to initialize from existing notes and wikilinks.
- **Architecture decisions**: Create concept nodes for components, link them with "related" or "parent" edges.
- **Dependency discovery**: Create nodes for packages, link to the components that use them.
- **Bug investigations**: Link bug nodes to the components and patterns involved.
- **Any time you see a relationship**: If A relates to B, create an edge. The graph gets more valuable over time.

### Graph Tools
| Tool | When to use |
|------|------------|
| \`populate_graph\` | Initialize graph from existing notes (idempotent, safe to re-run) |
| \`create_node\` | Create a concept, tag, or note-linked node |
| \`create_edge\` | Link two nodes (types: wikilink, related, parent, tagged, custom) |
| \`query_graph\` | Search the graph by node type, label, or connectivity |
| \`get_neighbors\` | Explore nodes connected to a specific node |
| \`query_note_graph\` | Get the connection subgraph around a note |

### Node Types
- **note** — linked to an existing note (set \`noteId\`)
- **tag** — represents a tag or category
- **concept** — free-form concept (architecture component, pattern, decision)

### Edge Types
- **wikilink** — note links to another note
- **related** — general relationship
- **parent** — hierarchical (component contains sub-component)
- **tagged** — node is tagged with a category
- **custom** — any other relationship (describe in metadata)

### Example: Mapping Architecture
\`\`\`
create_node({ label: "Auth Module", nodeType: "concept", workspaceId: "..." })
create_node({ label: "PostgreSQL", nodeType: "concept", workspaceId: "..." })
create_edge({ sourceId: authNodeId, targetId: pgNodeId, edgeType: "related", workspaceId: "..." })
\`\`\`

## MCP Tools Reference

### Session & Context
| Tool | When to use |
|------|------------|
| \`project_context_load\` | Session start — loads project context |
| \`session_context_resume\` | Resume from previous session |
| \`session_log\` | Log session summary at end |

### Knowledge (quick structured entries)
| Tool | When to use |
|------|------------|
| \`knowledge_store\` | Store a knowledge entry (key, content, tags) |
| \`recall_knowledge\` | Semantic search across stored knowledge |
| \`bulk_knowledge_recall\` | Recall by tag patterns (e.g., all \`arch/*\`) |
| \`knowledge_snapshot\` | Export all knowledge at once |

### Notes (full documents)
| Tool | When to use |
|------|------------|
| \`create_note\` | Create a new note (title, content, folderId) |
| \`update_note\` | Replace note content |
| \`append_to_note\` | Add content to an existing note |
| \`get_note\` | Read a note by ID |
| \`get_note_by_title\` | Find a note by title |
| \`search_notes\` | Full-text or semantic search |
| \`list_notes\` | List notes in a folder |
| \`daily_note\` | Create or get today's daily note |
| \`manage_tags\` | Add/remove tags on notes |
| \`pin_note\` / \`toggle_star\` | Pin or star important notes |

### Organization
| Tool | When to use |
|------|------------|
| \`list_folders\` | List folders in workspace |
| \`create_folder\` | Create a new folder |
| \`move_note\` | Move note to a different folder |
| \`context_fetch\` | Search notes by query |

### Knowledge Graph
| Tool | When to use |
|------|------------|
| \`populate_graph\` | Initialize graph from notes (run once at start) |
| \`create_node\` | Add a concept, tag, or note-linked node |
| \`create_edge\` | Link two nodes with a typed relationship |
| \`query_graph\` | Search graph by type, label, or connectivity |
| \`get_neighbors\` | Explore connections from a node |
| \`query_note_graph\` | Get subgraph around a specific note |

All tools require \`workspaceId: "${opts.workspaceId}"\`.`;
}
