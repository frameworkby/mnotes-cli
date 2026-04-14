export interface CodexTemplateOpts {
  url: string;
  workspaceId: string;
}

export function generateCodexTemplate(opts: CodexTemplateOpts): string {
  return `<!-- m-notes instructions v3 -->
# m-notes — Your Wiki

Server: ${opts.url}
Workspace: ${opts.workspaceId}

You are the author and maintainer of a living wiki. Raw sources are immutable inputs; your notes are the wiki; notes tagged \`type:config\` are the rules you follow when editing.

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
  1. \`search_notes\` + \`query_graph\` to find 3–15 related notes
  2. Plan creates/updates with \`[[wikilinks]]\` connecting touched notes
  3. Apply — each touched note gets a \`source/<slug>\` tag
- Periodically run the **lint loop**: \`scan_knowledge_conflicts\`, find orphans via \`query_note_graph\`, fix broken \`[[wikilinks]]\`, update stale notes.
- Every new or edited note must have at least one outbound \`[[wikilink]]\`.

### Key Naming Conventions
- arch/{component} -- architecture decisions
- pattern/{name} -- code patterns and idioms
- bug/{id} -- bug investigations
- dep/{package} -- dependency notes
- decision/{topic} -- product/tech decisions
- context/{area} -- domain knowledge

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
- create_note / update_note / append_to_note -- note authoring
- search_notes / get_note / list_notes -- note retrieval
- context_fetch -- search notes by query
- populate_graph -- initialize graph (idempotent)
- create_node / create_edge -- build graph structure
- query_graph / get_neighbors / query_note_graph -- explore graph`;
}
