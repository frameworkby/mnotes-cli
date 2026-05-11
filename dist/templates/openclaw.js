"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOpenClawTemplate = generateOpenClawTemplate;
function generateOpenClawTemplate(opts) {
    return `<!-- m-notes instructions v7 -->
# m-notes — Your Wiki

**Server**: ${opts.url}
**Workspace**: ${opts.workspaceId}

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
- [ ] \`recall_knowledge\` for the user's topic
- [ ] \`search_notes\` for related pages
- [ ] \`populate_graph\` if graph is empty

Do not skip this. Do not assume you know what's in the wiki.

**During Work:**
- [ ] Non-obvious discovery → \`knowledge_store\` immediately
- [ ] Decision made → \`decision/{topic}\`
- [ ] Bug fixed → \`bug/{id}\` with root cause
- [ ] User correction → store it

**What NOT to store:** trivial changes, info obvious from code, duplicates.

**Session End:**
- [ ] If you did meaningful work and stored nothing — go back and store it

## Core Loops

**Ingest** — when given a source (URL/paste): find **10–15 related notes** via \`search_notes\` + \`recall_knowledge\` — a non-trivial source typically touches 10–15 pages, not 3. Update or create, link them with \`[[wikilinks]]\`, add a "Sources" section and \`source/<slug>\` tag to each touched note. Update frontmatter (\`updated\`, \`sources\`, \`related\`). Log with \`wiki_log_append --kind ingest\`. Refresh index with \`wiki_index_refresh\`.

**Query** — when answering a non-trivial question: search the wiki first; if the answer required real synthesis, file it back as a new note using the appropriate page type (\`concept\`, \`overview\`, etc.). Log with \`wiki_log_append --kind query\`. This is the compounding loop.

**Lint** — periodically check for contradictions, orphan notes, broken wikilinks, stale entries. Log findings with \`wiki_log_append --kind lint\`.

## Quick Reference

Store knowledge:
\`\`\`
Call knowledge_store with:
  - workspaceId: "${opts.workspaceId}"
  - key: "<category>/<name>"
  - content: "<what you learned>"
  - tags: ["<category>"]
\`\`\`

Recall knowledge:
\`\`\`
Call recall_knowledge with:
  - workspaceId: "${opts.workspaceId}"
  - query: "<what you're looking for>"
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
Call populate_graph with:
  - workspaceId: "${opts.workspaceId}"
(initializes from existing notes — idempotent)

Call create_node with:
  - label: "<concept name>"
  - nodeType: "concept" (or "note", "tag")
  - workspaceId: "${opts.workspaceId}"

Call create_edge with:
  - sourceId: "<node id>"
  - targetId: "<node id>"
  - edgeType: "related" (or "parent", "tagged", "custom")
  - workspaceId: "${opts.workspaceId}"
\`\`\`

## Available MCP Tools
- \`knowledge_store\` -- Store knowledge
- \`recall_knowledge\` -- Semantic search
- \`bulk_knowledge_recall\` -- Recall by tag pattern
- \`knowledge_snapshot\` -- Export all knowledge
- \`scan_knowledge_conflicts\` -- Lint: find contradictions
- \`wiki_log_append\` -- Append ingest/query/lint/decision log entry
- \`wiki_index_refresh\` -- Regenerate Wiki Index from current notes
- \`context_fetch\` / \`search_notes\` -- Search notes
- \`create_note\` / \`update_note\` / \`append_to_note\` -- Note authoring
- \`populate_graph\` -- Initialize graph
- \`create_node\` / \`create_edge\` -- Build graph structure
- \`query_graph\` / \`get_neighbors\` / \`query_note_graph\` -- Explore graph`;
}
