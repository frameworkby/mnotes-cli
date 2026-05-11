export interface CodexTemplateOpts {
  url: string;
  workspaceId: string;
}

export function generateCodexTemplate(opts: CodexTemplateOpts): string {
  return `<!-- m-notes instructions v7 -->
# m-notes — Your Wiki

Server: ${opts.url}
Workspace: ${opts.workspaceId}

Division of labour: the human curates sources and asks questions. You do the grunt work — summarising, cross-referencing, filing, bookkeeping.

You are the author and maintainer of a living wiki. Raw sources are immutable inputs; your notes are the wiki; the schema (notes tagged \`type:config\`) are the rules you follow when editing.

## The Three Layers

1. **Raw sources** — user messages, pasted docs, URLs, files. Immutable. Never edit these.
2. **The wiki** — your notes. Interlinked with \`[[wikilinks]]\`, tagged for retrieval, updated as sources change.
3. **The schema** — notes tagged \`type:config\`. The user's rules for wiki organization. Read before editing.

## Page Types (for long-form wiki notes)

Use the most specific \`type\` in frontmatter when creating notes:

| type | Use when... |
|------|-------------|
| \`concept\` | A recurring idea, pattern, or principle |
| \`entity\` | A person, library, product, or system |
| \`source-summary\` | A distilled summary of one raw source |
| \`comparison\` | A side-by-side of two or more entities/concepts |
| \`overview\` | A top-down map of a topic area |

These apply to wiki notes. They are distinct from kb-store fast-capture categories (\`arch/\`, \`pattern/\`, \`bug/\`, etc.).

### Recommended Frontmatter

\`\`\`yaml
---
title: <human-readable>
type: concept | entity | source-summary | comparison | overview
sources: [<raw source ids or slugs>]
related: [<linked note titles>]
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: high | medium | low
---
\`\`\`

## Session Lifecycle

### Session Start
- Call \`project_context_load\` with workspaceId "${opts.workspaceId}".
- To resume, call \`session_context_resume\`.
- If the graph is empty, call \`populate_graph\` (idempotent).
- Read any notes tagged \`type:config\` before editing.

### Non-Negotiable Checklist

These are not suggestions. Skip any step and the wiki degrades.

**Session Start (before ANY work):**
- [ ] \`project_context_load\` with workspaceId "${opts.workspaceId}"
- [ ] \`recall_knowledge\` for the user's topic
- [ ] \`search_notes\` for related pages
- [ ] \`populate_graph\` if graph is empty
- [ ] Read \`type:config\` schema notes before editing

Do not skip this. Do not assume you know what's in the wiki.

**During Work (every time you learn something):**
- [ ] Non-obvious discovery → \`knowledge_store\` immediately
- [ ] Architecture/design decision → \`arch/{component}\`
- [ ] Bug fix → \`bug/{id}\` with root cause
- [ ] Gotcha/footgun → \`gotcha/{description}\`
- [ ] User correction → store it

**What NOT to store:** trivial changes, info obvious from code, duplicates (check \`recall_knowledge\` first).

**Session End:**
- [ ] \`session_log\` with summary, decisions, follow-ups
- [ ] If you did meaningful work and stored nothing — go back and store it

### During Work
- Recall before researching: \`recall_knowledge\`, \`search_notes\`.
- Store discoveries via \`knowledge_store\` (key: \`<category>/<name>\`, tags: [category]).
- When the user supplies a source (URL/paste/file), run the **ingest loop**:
  1. \`search_notes\` + \`query_graph\` to find **10–15 related notes** — a non-trivial source typically touches 10–15 pages, not 3
  2. Plan creates/updates with \`[[wikilinks]]\` connecting touched notes; update frontmatter (\`updated\`, \`sources\`, \`related\`)
  3. Apply — each touched note gets a \`source/<slug>\` tag and a "Sources" section
- **Query loop**: when answering a non-trivial question, search the wiki first; if the answer required real synthesis, file it back as a new note (choose the appropriate page type). This is the compounding loop.
- Periodically run the **lint loop**: \`scan_knowledge_conflicts\`, find orphans via \`query_note_graph\`, fix broken \`[[wikilinks]]\`, update stale notes. Log result with \`wiki_log_append --kind lint\`.
- Every new or edited note must have at least one outbound \`[[wikilink]]\`.

### Key Naming Conventions (kb-store fast-capture)
- arch/{component} -- architecture decisions
- pattern/{name} -- code patterns and idioms
- bug/{id} -- bug investigations
- dep/{package} -- dependency notes
- decision/{topic} -- product/tech decisions
- context/{area} -- domain knowledge
- gotcha/{description} -- footguns

**Promotion rule**: if a kb entry is recalled 3+ times, promote it to a full wiki note. Use page-type vocabulary: recurring pattern → \`concept\`, library/tool → \`entity\`, summarised investigation → \`source-summary\`.

### Session End
- Call \`session_log\` with workspaceId "${opts.workspaceId}", summary, decisions, actions.

## Knowledge Graph

Every note belongs to the graph. Build relationships proactively.

- Node types: note, tag, concept
- Edge types: wikilink, related, parent, tagged, custom

Example:
  create_node({ label: "Auth Module", nodeType: "concept", workspaceId: "${opts.workspaceId}" })
  create_edge({ sourceId: "...", targetId: "...", edgeType: "related", workspaceId: "${opts.workspaceId}" })

## Available MCP Tools
- project_context_load -- load context at session start
- session_context_resume -- resume previous session
- knowledge_store -- store knowledge entry
- recall_knowledge -- semantic search
- bulk_knowledge_recall -- recall by tag pattern
- knowledge_snapshot -- export all knowledge
- scan_knowledge_conflicts -- lint for contradictions
- session_log -- log session summary
- wiki_log_append -- append ingest/query/lint/decision log entry
- wiki_index_refresh -- regenerate Wiki Index from current notes
- create_note / update_note / append_to_note -- note authoring
- search_notes / get_note / list_notes -- note retrieval
- context_fetch -- search notes by query
- populate_graph -- initialize graph (idempotent)
- create_node / create_edge -- build graph structure
- query_graph / get_neighbors / query_note_graph -- explore graph`;
}
