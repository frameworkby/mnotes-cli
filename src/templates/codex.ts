export interface CodexTemplateOpts {
  url: string;
  workspaceId: string;
}

export function generateCodexTemplate(opts: CodexTemplateOpts): string {
  return `# m-notes AI Knowledge Base

Server: ${opts.url}
Workspace: ${opts.workspaceId}

## Session Lifecycle

### Session Start
Call \`project_context_load\` with workspaceId "${opts.workspaceId}" and a query describing your current task.
To resume a previous session, call \`session_context_resume\` with workspaceId "${opts.workspaceId}".

### During Work
Store discoveries, decisions, and patterns via \`knowledge_store\`:
- workspaceId: "${opts.workspaceId}"
- key: "<category>/<name>"
- content: what you learned
- tags: [category]

### Key Naming Conventions
- arch/{component} -- architecture decisions (e.g. arch/database, arch/auth)
- pattern/{name} -- code patterns and idioms
- bug/{id} -- bug investigations and fixes
- dep/{package} -- dependency notes and version constraints
- decision/{topic} -- product/tech decisions with rationale
- context/{area} -- project context and domain knowledge

### Session End
Call \`session_log\` with workspaceId "${opts.workspaceId}", a summary, decisions, and actions.

## Available MCP Tools
- project_context_load -- load project context at session start
- session_context_resume -- resume from previous session
- knowledge_store -- store knowledge entries
- recall_knowledge -- semantic search for knowledge
- bulk_knowledge_recall -- recall by tag patterns
- knowledge_snapshot -- export all knowledge
- session_log -- log session summary
- context_fetch -- search notes by query`;
}
