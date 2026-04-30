"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkTagAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.bulkTagAction = {
    name: "tag",
    describe: "Append or remove tags on multiple notes at once. Existing tags on each note are preserved (no duplicates) when adding.",
    mcpTool: "bulk_tag",
    args: (cmd) => cmd
        .requiredOption("--note-ids <csv>", "Comma-separated note IDs (1-100)")
        .requiredOption("--tags <csv>", "Comma-separated tags (1-50)")
        .requiredOption("--op <add|remove>", "Operation: add or remove")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        if (input.op !== "add" && input.op !== "remove") {
            throw new Error("--op must be 'add' or 'remove'");
        }
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const noteIds = input.noteIds
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        const tags = input.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        if (noteIds.length === 0) {
            throw new Error("--note-ids must include at least one ID");
        }
        if (tags.length === 0) {
            throw new Error("--tags must include at least one tag");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.bulkTag({ noteIds, tags, op: input.op, workspaceId });
    },
};
