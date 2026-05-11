"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.byTitleAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.byTitleAction = {
    name: "by-title",
    describe: "Look up a note by exact title.",
    mcpTool: "get_note_by_title",
    args: (cmd) => cmd
        .requiredOption("--title <s>", "Exact note title"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId)
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.getNoteByTitle({ workspaceId, title: input.title });
    },
};
