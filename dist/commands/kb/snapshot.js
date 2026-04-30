"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snapshotAction = void 0;
const commander_1 = require("commander");
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.snapshotAction = {
    name: "snapshot",
    describe: "Export a snapshot of all knowledge entries in the workspace as JSON (default) or markdown. Optionally filter by tags.",
    mcpTool: "knowledge_snapshot",
    args: (cmd) => cmd
        .option("--workspace-id <id>", "Workspace ID")
        .option("--tags <csv>", "Comma-separated tags filter")
        .addOption(new commander_1.Option("--format <f>", "Output format")
        .choices(["json", "markdown"])
        .default("json")),
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
        return client.knowledgeSnapshot({
            workspaceId,
            tags,
            format: input.format,
        });
    },
};
