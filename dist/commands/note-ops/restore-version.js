"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreVersionAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.restoreVersionAction = {
    name: "restore-version",
    describe: "Restore a note to a previous version snapshot.",
    mcpTool: "restore_version",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Note ID")
        .requiredOption("--version-id <id>", "Version ID to restore")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId)
            throw new Error("workspaceId is required");
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.restoreVersion(input.id, { workspaceId, versionId: input.versionId });
    },
};
