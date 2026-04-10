export interface OpenClawTemplateOpts {
  url: string;
  workspaceId: string;
}

export function generateOpenClawTemplate(opts: OpenClawTemplateOpts): string {
  return `# m-notes Knowledge Base

**Server**: ${opts.url}
**Workspace**: ${opts.workspaceId}

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

Build structured relationships as you work:
\`\`\`
Call populate_graph with:
  - workspaceId: "${opts.workspaceId}"
(initializes graph from existing notes — run once)

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
- \`knowledge_store\` -- Store knowledge entries
- \`recall_knowledge\` -- Semantic search for knowledge
- \`bulk_knowledge_recall\` -- Recall by tag patterns
- \`knowledge_snapshot\` -- Export all knowledge
- \`context_fetch\` -- Search notes by query
- \`populate_graph\` -- Initialize knowledge graph from notes
- \`create_node\` -- Add concept/tag/note node to the graph
- \`create_edge\` -- Link two nodes with a typed relationship
- \`query_graph\` -- Search graph by type, label, or connectivity
- \`get_neighbors\` -- Explore connections from a node`;
}
