"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteSummaryAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.noteSummaryAction = {
    name: "note-summary",
    describe: "AI-generated short summary of a note.",
    mcpTool: "note_summary",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Note ID")
        .option("--max-length <n>", "Max summary chars (50-500, default 150)", (v) => parseInt(v, 10))
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId)
            throw new Error("workspaceId is required");
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.noteSummary(input.id, {
            workspaceId,
            maxLength: input.maxLength,
        });
    },
};
