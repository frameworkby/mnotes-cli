export interface CodexTemplateOpts {
  url: string;
  workspaceId: string;
}

export function generateCodexTemplate(opts: CodexTemplateOpts): string {
  return `<!-- m-notes instructions v8 -->
# m-notes — Your Wiki

Server: ${opts.url}
Workspace: ${opts.workspaceId}

All access is through the \`mnotes\` CLI (it talks to the m-notes v1 API). Every command accepts \`--workspace ${opts.workspaceId}\` and \`--json\` for machine-readable output.

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
- Run \`mnotes composite project-load\` to load workspace context.
- To resume, run \`mnotes session resume\`.
- If the graph is empty, run \`mnotes graph populate\` (idempotent).
- Read any notes tagged \`type:config\` before editing.

### Non-Negotiable Checklist

These are not suggestions. Skip any step and the wiki degrades.

**Session Start (before ANY work):**
- [ ] \`mnotes composite project-load\`
- [ ] \`mnotes kb recall --query "<the user's topic>"\`
- [ ] \`mnotes search "<related terms>"\`
- [ ] \`mnotes graph populate\` if graph is empty
- [ ] Read \`type:config\` schema notes before editing

Do not skip this. Do not assume you know what's in the wiki.

**During Work (every time you learn something):**
- [ ] Non-obvious discovery → \`mnotes kb store\` immediately
- [ ] Architecture/design decision → key \`arch/{component}\`
- [ ] Bug fix → key \`bug/{id}\` with root cause
- [ ] Gotcha/footgun → key \`gotcha/{description}\`
- [ ] User correction → store it

**What NOT to store:** trivial changes, info obvious from code, duplicates (check \`mnotes kb recall\` first).

**Session End:**
- [ ] \`mnotes session log\` with summary, decisions, follow-ups
- [ ] If you did meaningful work and stored nothing — go back and store it

### During Work
- Recall before researching: \`mnotes kb recall\`, \`mnotes search\`.
- Store discoveries via \`mnotes kb store --key "<category>/<name>" --content "..." --tags <category>\`.
- When the user supplies a source (URL/paste/file), run the **ingest loop**:
  1. \`mnotes search\` + \`mnotes graph query\` to find **10–15 related notes** — a non-trivial source typically touches 10–15 pages, not 3
  2. Plan creates/updates with \`[[wikilinks]]\` connecting touched notes; update frontmatter (\`updated\`, \`sources\`, \`related\`)
  3. Apply — each touched note gets a \`source/<slug>\` tag and a "Sources" section
- **Query loop**: when answering a non-trivial question, search the wiki first; if the answer required real synthesis, file it back as a new note (choose the appropriate page type). This is the compounding loop.
- Periodically run the **lint loop**: \`mnotes kb scan-conflicts\`, find orphans via \`mnotes graph query-note\`, fix broken \`[[wikilinks]]\`, update stale notes. Log result with \`mnotes wiki log-append --kind lint\`.
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
- Run \`mnotes session log --summary "..." \` with decisions and actions.

## Knowledge Graph

Every note belongs to the graph. Build relationships proactively.

- Node types: note, tag, concept
- Edge types: wikilink, related, parent, tagged, custom

Example:
  mnotes graph create-node --label "Auth Module" --node-type concept
  mnotes graph create-edge --source <id> --target <id> --edge-type related

## Common CLI commands
- \`mnotes composite project-load\` -- load context at session start
- \`mnotes session resume\` -- resume previous session
- \`mnotes kb store\` -- store a knowledge entry
- \`mnotes kb recall\` -- semantic search
- \`mnotes bulk knowledge-recall\` -- recall by tag pattern
- \`mnotes kb snapshot\` -- export all knowledge
- \`mnotes kb scan-conflicts\` -- lint for contradictions
- \`mnotes session log\` -- log a session summary
- \`mnotes wiki log-append\` -- append ingest/query/lint/decision log entry
- \`mnotes wiki index-refresh\` -- regenerate the Wiki Index from current notes
- \`mnotes note create\` / \`mnotes note update\` / \`mnotes note-ops append\` -- note authoring
- \`mnotes search\` / \`mnotes note get\` / \`mnotes note list\` -- note retrieval
- \`mnotes composite context-fetch\` -- search notes by query
- \`mnotes graph populate\` -- initialize the graph (idempotent)
- \`mnotes graph create-node\` / \`mnotes graph create-edge\` -- build graph structure
- \`mnotes graph query\` / \`mnotes graph neighbors\` / \`mnotes graph query-note\` -- explore the graph

Run \`mnotes <group> --help\` for flags on any command.`;
}
