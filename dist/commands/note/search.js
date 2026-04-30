"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchNotesAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
const output_1 = require("../../output");
exports.searchNotesAction = {
    name: "search",
    describe: "Search notes (full-text or semantic)",
    mcpTool: "search_notes",
    positional: ["query"],
    args: (cmd) => cmd
        .argument("<query>", "Search query")
        .option("--workspace <id>", "Workspace ID")
        .option("--limit <n>", "Max results to display", (v) => parseInt(v, 10))
        .option("--semantic", "Use semantic (vector) search instead of full-text"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const res = await client.searchNotes({
            query: input.query,
            mode: input.semantic ? "semantic" : "fulltext",
            workspaceId: input.workspace ?? config.workspaceId,
        });
        let results = res.data.results;
        if (input.limit !== undefined && input.limit > 0) {
            results = results.slice(0, input.limit);
        }
        return { results };
    },
    renderHuman: (output) => {
        (0, output_1.printSearchResults)(output.results);
    },
};
