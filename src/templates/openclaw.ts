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

## Available MCP Tools
- \`knowledge_store\` -- Store knowledge entries
- \`recall_knowledge\` -- Semantic search for knowledge
- \`bulk_knowledge_recall\` -- Recall by tag patterns
- \`knowledge_snapshot\` -- Export all knowledge
- \`context_fetch\` -- Search notes by query`;
}
