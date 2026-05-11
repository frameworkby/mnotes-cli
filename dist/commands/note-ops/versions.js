"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionsAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.versionsAction = {
    name: "versions",
    describe: "List historical versions of a note (default: 10, max 50).",
    mcpTool: "list_versions",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Note ID")
        .option("--limit <n>", "Max results (1-50)", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId)
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.listVersions(input.id, { workspaceId, limit: input.limit });
    },
};
