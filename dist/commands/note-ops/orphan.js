"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orphanAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.orphanAction = {
    name: "orphan",
    describe: "List notes with no incoming or outgoing wikilinks.",
    mcpTool: "orphan_notes",
    args: (cmd) => cmd
        .option("--limit <n>", "Max results (1-200)", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId)
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.orphanNotes({ workspaceId, limit: input.limit });
    },
};
