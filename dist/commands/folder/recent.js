"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.folderRecentAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.folderRecentAction = {
    name: "recent",
    // Mirrored verbatim from MCP `get_recent_notes` description.
    describe: "Get notes modified since a given timestamp. Returns notes sorted by updatedAt descending.",
    // Mounted under `folder` to match the MCP grouping (folder-tools.ts owns this
    // tool even though it returns notes). Operator-confirmed naming choice.
    mcpTool: "get_recent_notes",
    args: (cmd) => cmd
        .requiredOption("--since <iso>", "ISO 8601 datetime string")
        .option("--limit <n>", "Max results (default 20, max 100)", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.getRecentNotes({
            since: input.since,
            workspaceId,
            limit: input.limit,
        });
    },
};
