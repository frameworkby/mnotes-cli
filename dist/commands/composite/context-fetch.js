"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextFetchAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.contextFetchAction = {
    name: "context-fetch",
    describe: "Token-budgeted hybrid retrieval: returns the most relevant notes for a query within a token budget.",
    mcpTool: "context_fetch",
    args: (cmd) => cmd
        .requiredOption("--query <s>", "Search query")
        .option("--limit <n>", "Max items", (v) => parseInt(v, 10))
        .option("--token-budget <n>", "Max tokens to return", (v) => parseInt(v, 10))
        .option("--types <csv>", "Comma-separated note types")
        .option("--tags <csv>", "Comma-separated tags"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId)
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        const types = input.types
            ? input.types.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined;
        const tags = input.tags
            ? input.tags.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined;
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.contextFetch({
            workspaceId,
            query: input.query,
            limit: input.limit,
            tokenBudget: input.tokenBudget,
            types,
            tags,
        });
    },
};
