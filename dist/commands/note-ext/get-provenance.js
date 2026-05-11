"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProvenanceAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.getProvenanceAction = {
    name: "get-provenance",
    describe: "Retrieve the provenance chain for a note — the list of sources where its knowledge originated.",
    mcpTool: "get_provenance",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Note ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.getProvenance(input.id, workspaceId);
    },
};
