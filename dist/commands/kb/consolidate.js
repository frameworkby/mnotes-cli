"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consolidateAction = void 0;
const commander_1 = require("commander");
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.consolidateAction = {
    name: "consolidate",
    describe: "Consolidate multiple knowledge notes into a single target note via merge or summarize strategy. Source notes are archived after consolidation.",
    mcpTool: "consolidate_memories",
    args: (cmd) => cmd
        .option("--workspace-id <id>", "Workspace ID")
        .requiredOption("--note-ids <csv>", "Comma-separated note IDs to consolidate")
        .requiredOption("--target-title <s>", "Title for the consolidated note")
        .addOption(new commander_1.Option("--strategy <s>", "Consolidation strategy")
        .choices(["merge", "summarize"])
        .makeOptionMandatory()),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const noteIds = input.noteIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);
        if (noteIds.length === 0) {
            throw new Error("--note-ids must contain at least one ID");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.consolidateMemories({
            noteIds,
            targetTitle: input.targetTitle,
            strategy: input.strategy,
            workspaceId,
        });
    },
};
