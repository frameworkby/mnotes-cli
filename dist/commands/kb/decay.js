"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decayAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.decayAction = {
    name: "decay",
    describe: "Find stale knowledge entries based on time-based decay scoring. Decay score = min(1.0, daysSinceUpdate / decayWindow). Score 0 = fresh, 1 = fully stale. Useful for prioritizing fresh information and flagging entries needing review.",
    mcpTool: "knowledge_decay",
    args: (cmd) => cmd
        .option("--threshold <n>", "Min decay score 0.0–1.0 (default 0.5)", (v) => parseFloat(v))
        .option("--limit <n>", "Max entries (default 20, max 200)", (v) => parseInt(v, 10))
        .option("--decay-window <n>", "Days for full decay (default 90, max 365)", (v) => parseInt(v, 10))
        .option("--tags <csv>", "Comma-separated tags filter")
        .option("--max-importance <n>", "Only entries below this importance", (v) => parseFloat(v)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const tags = input.tags
            ? input.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : undefined;
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.knowledgeDecay({
            workspaceId,
            threshold: input.threshold,
            limit: input.limit,
            decayWindow: input.decayWindow,
            tags,
            maxImportance: input.maxImportance,
        });
    },
};
