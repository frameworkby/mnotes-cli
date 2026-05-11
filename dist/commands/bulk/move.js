"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkMoveAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.bulkMoveAction = {
    name: "move",
    describe: "Move multiple notes to a target folder. Returns error if the folder does not exist or is not owned by the caller.",
    mcpTool: "bulk_move",
    args: (cmd) => cmd
        .requiredOption("--note-ids <csv>", "Comma-separated note IDs (1-100)")
        .requiredOption("--target-folder-id <id>", "Target folder ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const noteIds = input.noteIds
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        if (noteIds.length === 0) {
            throw new Error("--note-ids must include at least one ID");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.bulkMove({
            noteIds,
            targetFolderId: input.targetFolderId,
            workspaceId,
        });
    },
};
