"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recallAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.recallAction = {
    name: "recall",
    // Mirrored verbatim from MCP `recall_knowledge` description.
    describe: "Retrieve knowledge entries ranked by a weighted combination of semantic similarity, importance, and freshness. finalScore = semanticScore * 0.7 + importance * 0.2 + freshnessScore * 0.1. Null importance is treated as 0. Freshness decays linearly over the decay window (default 90 days).",
    mcpTool: "recall_knowledge",
    // Story-mandated backward-compat alias for the legacy flat command. Also
    // honor the underscore form that the previous CLI surface used.
    aliases: ["recall-knowledge", "recall_knowledge"],
    args: (cmd) => cmd
        .requiredOption("--query <text>", "Natural language query")
        .option("--tags <csv>", "Comma-separated tags filter")
        .option("--limit <n>", "Max results (default 10, max 50)", (v) => parseInt(v, 10))
        .option("--decay-window <n>", "Days for full freshness decay (default 90)", (v) => parseInt(v, 10))
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const tags = input.tags
            ? input.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : undefined;
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const apiResp = await client.recallKnowledge({
            query: input.query,
            workspaceId,
            tags,
            limit: input.limit,
        });
        // API returns `{ data: { results } }`; MCP's `recall_knowledge` returns the
        // results array directly. Reshape to match MCP — that's the parity contract.
        return apiResp.data.results;
    },
};
