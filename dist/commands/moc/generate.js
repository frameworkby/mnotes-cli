"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMocAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.generateMocAction = {
    name: "generate",
    describe: "Generate a Map of Content (MoC) note for a folder or tag. Notes are ordered by embedding similarity and each line is a wikilink with a one-sentence description. Re-running updates the existing MoC.",
    mcpTool: "generate_moc",
    args: (cmd) => cmd
        .requiredOption("--scope-type <type>", "Scope type: folder or tag")
        .requiredOption("--scope-id <id>", "Folder ID or tag name")
        .option("--limit <n>", "Max notes (1-200, default 50)", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        if (input.scopeType !== "folder" && input.scopeType !== "tag") {
            throw new Error("--scope-type must be 'folder' or 'tag'");
        }
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.generateMoc({
            workspaceId,
            scopeType: input.scopeType,
            scopeId: input.scopeId,
            limit: input.limit,
        });
    },
};
