"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.askAction = {
    name: "ask",
    describe: "Ask a natural-language question against the knowledge base. Returns an answer with confidence score and supporting source excerpts.",
    mcpTool: "ask_notes",
    args: (cmd) => cmd
        .option("--workspace-id <id>", "Workspace ID")
        .requiredOption("--question <q>", "The question to ask")
        .option("--limit <n>", "Max sources to consider", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.askNotes({
            question: input.question,
            workspaceId,
            limit: input.limit,
        });
    },
};
