"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanConflictsAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.scanConflictsAction = {
    name: "scan-conflicts",
    describe: "Kick off a background scan to detect conflicting/overlapping knowledge entries. Returns a scan ID and the estimated number of pairs to be analysed.",
    mcpTool: "scan_knowledge_conflicts",
    args: (cmd) => cmd
        .option("--workspace-id <id>", "Workspace ID")
        .option("--similarity-threshold <n>", "Minimum similarity 0.0–1.0 to consider a pair", (v) => parseFloat(v))
        .option("--pair-cap <n>", "Maximum pairs to analyse", (v) => parseInt(v, 10))
        .option("--tags <csv>", "Comma-separated tags filter"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const tags = input.tags
            ? input.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : undefined;
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.scanKnowledgeConflicts({
            workspaceId,
            similarityThreshold: input.similarityThreshold,
            pairCap: input.pairCap,
            tags,
        });
    },
};
