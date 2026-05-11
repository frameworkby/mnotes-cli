"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.starAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.starAction = {
    name: "star",
    describe: "Star or unstar a note (default: star). Pass --no-starred to unstar.",
    mcpTool: "toggle_star",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Note ID")
        .option("--starred", "Star the note (default true)", true)
        .option("--no-starred", "Unstar the note"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId)
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        const starred = input.starred !== false;
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.toggleStar(input.id, { workspaceId, starred });
    },
};
