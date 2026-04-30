"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkArchiveAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.bulkArchiveAction = {
    name: "archive",
    describe: "Archive multiple notes, removing them from default note listings without deleting them. Already-archived notes are silently skipped.",
    mcpTool: "bulk_archive",
    args: (cmd) => cmd
        .requiredOption("--note-ids <csv>", "Comma-separated note IDs (1-100)")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const noteIds = input.noteIds
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        if (noteIds.length === 0) {
            throw new Error("--note-ids must include at least one ID");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.bulkArchive({ noteIds, workspaceId });
    },
};
