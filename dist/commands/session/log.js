"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionLogAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.sessionLogAction = {
    name: "log",
    describe: "Log an AI conversation summary with decisions and actions. Creates an audit trail across sessions. If the same sessionId is used again, the new entry is appended to the existing log note.",
    mcpTool: "session_log",
    args: (cmd) => cmd
        .requiredOption("--session-id <id>", "Unique session identifier — same ID appends to the same log note")
        .requiredOption("--summary <text>", "Summary of what happened in this segment")
        .option("--decisions <json>", 'JSON array of decisions: [{"decision","rationale"}]')
        .option("--actions <json>", 'JSON array of actions: [{"action","target"}]')
        .option("--tags <csv>", "Comma-separated tags")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const tags = input.tags
            ? input.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : undefined;
        const decisions = input.decisions
            ? JSON.parse(input.decisions)
            : undefined;
        const actions = input.actions
            ? JSON.parse(input.actions)
            : undefined;
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.sessionLog({
            sessionId: input.sessionId,
            summary: input.summary,
            decisions,
            actions,
            tags,
            workspaceId,
        });
    },
};
