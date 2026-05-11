"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSmartFolderAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.createSmartFolderAction = {
    name: "create",
    describe: "Create a smart folder (saved search) with a name, query, and search mode (fulltext or semantic).",
    mcpTool: "create_smart_folder",
    args: (cmd) => cmd
        .requiredOption("--name <name>", "Smart folder name")
        .requiredOption("--query <q>", "Search query")
        .requiredOption("--mode <m>", "Search mode: fulltext or semantic"),
    run: async (input, ctx) => {
        if (input.mode !== "fulltext" && input.mode !== "semantic") {
            throw new Error("--mode must be 'fulltext' or 'semantic'");
        }
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.createSmartFolder({
            workspaceId,
            name: input.name,
            query: input.query,
            mode: input.mode,
        });
    },
};
