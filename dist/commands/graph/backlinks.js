"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backlinksAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.backlinksAction = {
    name: "backlinks",
    describe: "List notes that wikilink to the given note.",
    mcpTool: "get_backlinks",
    positional: ["id"],
    args: (cmd) => cmd.argument("<id>", "Note ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.getBacklinks(input.id, workspaceId);
    },
};
