"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveFolderAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.moveFolderAction = {
    name: "move",
    // Mirrored verbatim from MCP `move_folder` description.
    describe: "Change a folder's parent. Set parentId to null to move to root level. Cannot move the root folder. Maximum nesting depth is 1.",
    mcpTool: "move_folder",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Folder ID to move")
        .option("--parent-id <id>", "New parent folder ID")
        .option("--root", "Move to root level (parentId = null)"),
    run: async (input, ctx) => {
        if (input.parentId && input.root) {
            throw new Error("--parent-id and --root are mutually exclusive");
        }
        if (!input.parentId && !input.root) {
            throw new Error("specify --parent-id <id> or --root");
        }
        const parentId = input.root ? null : input.parentId ?? null;
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.moveFolder(input.id, parentId);
    },
};
