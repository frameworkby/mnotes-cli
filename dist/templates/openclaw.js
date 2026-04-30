"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOpenClawTemplate = generateOpenClawTemplate;
function generateOpenClawTemplate(opts) {
    return `<!-- m-notes instructions v3 -->
# m-notes — Your Wiki

**Server**: ${opts.url}
**Workspace**: ${opts.workspaceId}

You are the author of a living wiki. Notes are interlinked with \`[[wikilinks]]\`. Sources are immutable; your writing is the wiki.

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

**Ingest** — when given a source (URL/paste): find 3+ related notes via \`recall_knowledge\`, update or create, link them with \`[[wikilinks]]\`, tag each with \`source/<slug>\`.

**Lint** — periodically check for contradictions, orphan notes, broken wikilinks, stale entries.

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

## Key Naming Conventions
- \`decision/{topic}\` -- product/tech decisions
- \`context/{area}\` -- project context
- \`bug/{id}\` -- bug investigations
- \`pattern/{name}\` -- code patterns

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
- \`context_fetch\` / \`search_notes\` -- Search notes
- \`create_note\` / \`update_note\` / \`append_to_note\` -- Note authoring
- \`populate_graph\` -- Initialize graph
- \`create_node\` / \`create_edge\` -- Build graph structure
- \`query_graph\` / \`get_neighbors\` / \`query_note_graph\` -- Explore graph`;
}
