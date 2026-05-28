export interface OpenClawTemplateOpts {
  url: string;
  workspaceId: string;
}

export function generateOpenClawTemplate(opts: OpenClawTemplateOpts): string {
  return `<!-- m-notes instructions v8 -->
# m-notes — Your Wiki

**Server**: ${opts.url}
**Workspace**: ${opts.workspaceId}

All access is through the \`mnotes\` CLI (it talks to the m-notes v1 API). Commands accept \`--workspace ${opts.workspaceId}\` and \`--json\`.

Division of labour: the human curates sources and asks questions. You do the grunt work — summarising, cross-referencing, filing, bookkeeping.

You are the author of a living wiki. Notes are interlinked with \`[[wikilinks]]\`. Sources are immutable; your writing is the wiki.

## The Three Layers

1. **Raw sources** — user messages, pasted docs, URLs, files. Immutable. Never edit these.
2. **The wiki** — your notes. Interlinked with \`[[wikilinks]]\`, updated as sources change.
3. **The schema** — notes tagged \`type:config\`. The user's rules. Read before editing.

## Page Types (for long-form wiki notes)

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

## Non-Negotiable Checklist

Skip any step and the wiki degrades.

**Session Start (before ANY work):**
- [ ] \`mnotes kb recall --query "<the user's topic>"\`
- [ ] \`mnotes search "<related terms>"\`
- [ ] \`mnotes graph populate\` if graph is empty

Do not skip this. Do not assume you know what's in the wiki.

**During Work:**
- [ ] Non-obvious discovery → \`mnotes kb store\` immediately
- [ ] Decision made → key \`decision/{topic}\`
- [ ] Bug fixed → key \`bug/{id}\` with root cause
- [ ] User correction → store it

**What NOT to store:** trivial changes, info obvious from code, duplicates.

**Session End:**
- [ ] If you did meaningful work and stored nothing — go back and store it

## Core Loops

**Ingest** — when given a source (URL/paste): find **10–15 related notes** via \`mnotes search\` + \`mnotes kb recall\` — a non-trivial source typically touches 10–15 pages, not 3. Update or create, link them with \`[[wikilinks]]\`, add a "Sources" section and \`source/<slug>\` tag to each touched note. Update frontmatter (\`updated\`, \`sources\`, \`related\`). Log with \`mnotes wiki log-append --kind ingest\`. Refresh index with \`mnotes wiki index-refresh\`.

**Query** — when answering a non-trivial question: search the wiki first; if the answer required real synthesis, file it back as a new note using the appropriate page type (\`concept\`, \`overview\`, etc.). Log with \`mnotes wiki log-append --kind query\`. This is the compounding loop.

**Lint** — periodically check for contradictions, orphan notes, broken wikilinks, stale entries. Log findings with \`mnotes wiki log-append --kind lint\`.

## Quick Reference

Store knowledge:
\`\`\`
mnotes kb store \\
  --key "<category>/<name>" \\
  --content "<what you learned>" \\
  --tags "<category>"
\`\`\`

Recall knowledge:
\`\`\`
mnotes kb recall --query "<what you're looking for>"
\`\`\`

## Key Naming Conventions (kb-store fast-capture)
- \`decision/{topic}\` -- product/tech decisions
- \`context/{area}\` -- project context
- \`bug/{id}\` -- bug investigations
- \`pattern/{name}\` -- code patterns
- \`arch/{component}\` -- architecture decisions
- \`gotcha/{description}\` -- footguns

**Promotion rule**: if a kb entry is recalled 3+ times, promote it to a full wiki note. Use page-type vocabulary: recurring pattern → \`concept\`, library/tool → \`entity\`, summarised investigation → \`source-summary\`.

## Knowledge Graph

Every note should link to at least one other. Build the graph proactively:
\`\`\`
mnotes graph populate          # initialize from existing notes (idempotent)
mnotes graph create-node --label "<concept name>" --node-type concept
mnotes graph create-edge --source <id> --target <id> --edge-type related
\`\`\`

## Common CLI commands
- \`mnotes kb store\` -- store knowledge
- \`mnotes kb recall\` -- semantic search
- \`mnotes bulk knowledge-recall\` -- recall by tag pattern
- \`mnotes kb snapshot\` -- export all knowledge
- \`mnotes kb scan-conflicts\` -- lint: find contradictions
- \`mnotes wiki log-append\` -- append ingest/query/lint/decision log entry
- \`mnotes wiki index-refresh\` -- regenerate the Wiki Index from current notes
- \`mnotes composite context-fetch\` / \`mnotes search\` -- search notes
- \`mnotes note create\` / \`mnotes note update\` / \`mnotes note-ops append\` -- note authoring
- \`mnotes graph populate\` -- initialize the graph
- \`mnotes graph create-node\` / \`mnotes graph create-edge\` -- build graph structure
- \`mnotes graph query\` / \`mnotes graph neighbors\` / \`mnotes graph query-note\` -- explore the graph

Run \`mnotes <group> --help\` for flags on any command.`;
}
