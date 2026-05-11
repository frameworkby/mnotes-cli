"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionResumeAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.sessionResumeAction = {
    name: "resume",
    describe: "Resume context from a previous session. Returns decisions, actions, tool-call summary, and (by default) affected notes for the most recent session, or a specified one.",
    mcpTool: "session_context_resume",
    args: (cmd) => cmd
        .option("--session-id <id>", "Session ID (defaults to most recent)")
        .option("--no-notes", "Skip including affected notes in the result"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        // Commander turns `--no-notes` into `notes: false`. Translate to API's
        // `include_notes: false`. When the flag is absent, leave undefined so the
        // server applies its default (include).
        const includeNotes = input.notes === false ? false : undefined;
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.sessionContextResume({
            workspaceId,
            sessionId: input.sessionId,
            includeNotes,
        });
    },
};
