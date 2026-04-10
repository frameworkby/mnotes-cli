"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateClaudeCodeTemplate = generateClaudeCodeTemplate;
function generateClaudeCodeTemplate(opts) {
    return `# m-notes AI Knowledge Base

**Server**: ${opts.url}
**Workspace**: ${opts.workspaceId}

## Session Lifecycle

### Session Start
At the beginning of each session, load project context:
\`\`\`
Call project_context_load with:
  - workspaceId: "${opts.workspaceId}"
  - query: "<describe what you're working on>"
\`\`\`

To resume from a previous session:
\`\`\`
Call session_context_resume with:
  - workspaceId: "${opts.workspaceId}"
\`\`\`

### During Work
Store important discoveries, decisions, and patterns:
\`\`\`
Call knowledge_store with:
  - workspaceId: "${opts.workspaceId}"
  - key: "<category>/<name>"
  - content: "<what you learned>"
  - tags: ["<category>"]
\`\`\`

### Key Naming Conventions
- \`arch/{component}\` -- architecture decisions (e.g., arch/database, arch/auth)
- \`pattern/{name}\` -- code patterns and idioms
- \`bug/{id}\` -- bug investigations and fixes
- \`dep/{package}\` -- dependency notes and version constraints
- \`decision/{topic}\` -- product/tech decisions with rationale
- \`context/{area}\` -- project context and domain knowledge

### Session End
Log a summary of what happened:
\`\`\`
Call session_log with:
  - workspaceId: "${opts.workspaceId}"
  - sessionId: "<your session id>"
  - summary: "<what was accomplished>"
  - decisions: [{ decision: "...", rationale: "..." }]
  - actions: [{ action: "...", target: "..." }]
\`\`\`

## Available MCP Tools
- \`project_context_load\` -- Load full project context at session start
- \`session_context_resume\` -- Resume from a previous session
- \`knowledge_store\` -- Store knowledge entries
- \`recall_knowledge\` -- Semantic search for knowledge
- \`bulk_knowledge_recall\` -- Recall by tag patterns
- \`knowledge_snapshot\` -- Export all knowledge
- \`session_log\` -- Log session summary
- \`context_fetch\` -- Search notes by query`;
}
