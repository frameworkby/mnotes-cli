"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manageFoldersAction = void 0;
const commander_1 = require("commander");
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.manageFoldersAction = {
    name: "manage",
    // Mirrored verbatim from MCP `manage_folders` description.
    describe: 'Create, rename, or delete a folder. Actions: "create" (requires name, optional parentId), "rename" (requires id, name), "delete" (requires id, fails if folder contains notes).',
    mcpTool: "manage_folders",
    args: (cmd) => cmd
        .addOption(new commander_1.Option("--action <action>", "Folder action to perform")
        .choices(["create", "rename", "delete"])
        .makeOptionMandatory(true))
        .option("--id <id>", "Folder ID (required for rename and delete)")
        .option("--name <name>", "Folder name (required for create and rename)")
        .option("--parent-id <id>", "Parent folder ID (optional, for create)"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        // `--action` is enforced by Commander's `.choices(...)` so we treat the
        // switch as exhaustive — no runtime "unknown action" branch needed.
        switch (input.action) {
            case "create": {
                if (!input.name)
                    throw new Error("--name is required for create action");
                const workspaceId = config.workspaceId;
                if (!workspaceId) {
                    throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
                }
                return client.createFolder({
                    name: input.name,
                    parentId: input.parentId,
                    workspaceId,
                });
            }
            case "rename": {
                if (!input.id)
                    throw new Error("--id is required for rename action");
                if (!input.name)
                    throw new Error("--name is required for rename action");
                return client.renameFolder(input.id, input.name);
            }
            case "delete": {
                if (!input.id)
                    throw new Error("--id is required for delete action");
                return client.deleteFolder(input.id);
            }
        }
    },
};
