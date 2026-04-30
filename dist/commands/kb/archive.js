"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.archiveAction = {
    name: "archive",
    describe: "Archive stale knowledge entries based on decay score and importance thresholds. Use --dry-run to preview which entries would be archived without making changes.",
    mcpTool: "archive_stale_memories",
    args: (cmd) => cmd
        .option("--workspace-id <id>", "Workspace ID")
        .option("--max-decay-score <n>", "Only archive entries with decay score above this", (v) => parseFloat(v))
        .option("--max-importance <n>", "Only archive entries below this importance", (v) => parseFloat(v))
        .option("--dry-run", "Preview without writing"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.archiveStaleMemories({
            workspaceId,
            maxDecayScore: input.maxDecayScore,
            maxImportance: input.maxImportance,
            dryRun: input.dryRun,
        });
    },
};
