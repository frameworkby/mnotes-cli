"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.folderSearchTagsAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.folderSearchTagsAction = {
    name: "search-tags",
    // Mirrored verbatim from MCP `search_by_tags` description.
    describe: 'Find notes matching given tags. Use match="any" (default) to find notes with at least one of the tags, or match="all" to find notes that have every specified tag.',
    // Mounted under `folder` to match the MCP grouping (folder-tools.ts owns this
    // tool even though it returns notes). Operator-confirmed naming choice.
    mcpTool: "search_by_tags",
    args: (cmd) => cmd
        .requiredOption("--tags <list>", "Comma-separated tags (at least one)")
        .option("--match <mode>", "any | all (default any)")
        .option("--limit <n>", "Max results (default 50, max 100)", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const tags = input.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        if (tags.length === 0) {
            throw new Error("--tags must contain at least one non-empty tag");
        }
        const match = input.match ?? "any";
        if (match !== "any" && match !== "all") {
            throw new Error('--match must be "any" or "all"');
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.searchByTags({
            tags,
            workspaceId,
            match,
            limit: input.limit,
        });
    },
};
