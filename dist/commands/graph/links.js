"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteLinksAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.noteLinksAction = {
    name: "links",
    describe: "List a note's outgoing wikilinks and incoming backlinks (resolved to existing notes).",
    mcpTool: "get_note_links",
    positional: ["id"],
    args: (cmd) => cmd.argument("<id>", "Note ID").option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.getNoteLinks(input.id, workspaceId);
    },
};
