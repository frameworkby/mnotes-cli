"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkKnowledgeRecallAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.bulkKnowledgeRecallAction = {
    name: "knowledge-recall",
    describe: "Recall knowledge entries matching multiple tag patterns in one call. Results are grouped by pattern, sorted by importance then freshness, and deduplicated across groups.",
    mcpTool: "bulk_knowledge_recall",
    args: (cmd) => cmd
        .requiredOption("--queries <csv>", "Comma-separated tag patterns (1-20)")
        .option("--limit <n>", "Max entries per pattern (default 20, max 100)", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const queries = input.queries
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        if (queries.length === 0) {
            throw new Error("--queries must include at least one pattern");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.bulkKnowledgeRecall({ queries, workspaceId, limit: input.limit });
    },
};
