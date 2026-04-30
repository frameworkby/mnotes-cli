"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSmartFolderAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.deleteSmartFolderAction = {
    name: "delete",
    describe: "Delete a smart folder by ID.",
    mcpTool: "delete_smart_folder",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Smart folder ID")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.deleteSmartFolder(input.id, workspaceId);
    },
};
