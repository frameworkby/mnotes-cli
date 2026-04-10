export interface ClaudeCodeTemplateOpts {
  url: string;
  workspaceId: string;
}

export function generateClaudeCodeTemplate(opts: ClaudeCodeTemplateOpts): string {
  return `# m-notes — Persistent Knowledge Base (MANDATORY)

**Server**: ${opts.url}
**Workspace**: ${opts.workspaceId}

> **IMPORTANT**: You MUST use m-notes tools throughout every session. This is your persistent memory across sessions — without it you start from zero every time. The instructions below are NOT optional.

## Rules (follow strictly)

1. **ALWAYS recall before researching.** Before exploring the codebase, reading files, or making assumptions about architecture — call \`recall_knowledge\` first. Past you already figured things out; don't waste tokens rediscovering them.
2. **ALWAYS store what you learn.** When you discover something non-obvious (architecture decisions, gotchas, patterns, bug root causes, dependency quirks) — store it immediately with \`knowledge_store\`. If it took effort to figure out, it's worth storing.
3. **ALWAYS log sessions.** Before the session ends, call \`session_log\` with a summary of what was accomplished, decisions made, and next steps. Future sessions depend on this.
4. **ALWAYS load context at session start.** Call \`project_context_load\` at the beginning of every session. The SessionStart hook does this automatically, but if you're resuming mid-conversation, call \`session_context_resume\`.

## When to Store Knowledge

Store knowledge **proactively** — don't wait for the user to ask. Store when you:
- Make or discover an architecture decision → \`arch/{component}\`
- Find a code pattern or convention → \`pattern/{name}\`
- Debug and fix a bug → \`bug/{id-or-description}\`
- Learn something about a dependency → \`dep/{package}\`
- Make a product or tech decision → \`decision/{topic}\`
- Build understanding of a domain area → \`context/{area}\`
- Discover a gotcha or footgun → \`gotcha/{description}\`
- Complete a task or story → \`task/{id}\`

## When to Recall Knowledge

Recall knowledge **before acting**. Specifically:
- Before making a tech decision → recall \`arch/*\` and \`decision/*\`
- Before touching a module → recall relevant \`pattern/*\` and \`context/*\`
- Before debugging → recall \`bug/*\` for similar past issues
- Before adding a dependency → recall \`dep/*\`
- At session start → \`project_context_load\` loads everything relevant
- When the user asks about past work → \`session_context_resume\`

## MCP Tools Reference

| Tool | When to use |
|------|------------|
| \`project_context_load\` | Session start — loads project context |
| \`session_context_resume\` | Resume from previous session |
| \`knowledge_store\` | Store any knowledge entry (key, content, tags) |
| \`recall_knowledge\` | Semantic search across stored knowledge |
| \`bulk_knowledge_recall\` | Recall by tag patterns (e.g., all \`arch/*\`) |
| \`knowledge_snapshot\` | Export all knowledge at once |
| \`session_log\` | Log session summary at end |
| \`context_fetch\` | Search notes by query |

All tools require \`workspaceId: "${opts.workspaceId}"\`.`;
}
