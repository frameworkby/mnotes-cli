"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEntitiesAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.extractEntitiesAction = {
    name: "extract",
    describe: "AI-extract entities (people, projects, concepts, orgs, locations) from a note.",
    mcpTool: "extract_entities",
    positional: ["noteId"],
    args: (cmd) => cmd
        .argument("<noteId>", "Source note ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId)
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.extractEntities({ noteId: input.noteId, workspaceId });
    },
};
