"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveConversationAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.saveConversationAction = {
    name: "save-conversation",
    describe: 'Save an AI conversation transcript as a new note. Pass --messages as a JSON array, e.g. \'[{"role":"user","content":"hi"}]\'.',
    mcpTool: "save_conversation",
    args: (cmd) => cmd
        .requiredOption("--messages <json>", 'JSON array: [{"role":"user|assistant","content":"..."}]')
        .option("--title <s>", "Optional conversation title")
        .option("--source <s>", "Optional source identifier")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const messages = JSON.parse(input.messages);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.saveConversation({
            workspaceId,
            messages,
            title: input.title,
            source: input.source,
        });
    },
};
