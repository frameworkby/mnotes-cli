"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manageTagsAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.manageTagsAction = {
    name: "manage",
    describe: "Rename, merge, or delete a tag across notes.",
    mcpTool: "manage_tags",
    args: (cmd) => cmd
        .requiredOption("--op <op>", "rename | merge | delete")
        .requiredOption("--from-tag <s>", "Source tag")
        .option("--to-tag <s>", "Destination tag (rename, merge)")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId)
            throw new Error("workspaceId is required");
        const op = input.op;
        if (op !== "rename" && op !== "merge" && op !== "delete") {
            throw new Error("--op must be one of: rename, merge, delete");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.manageTags({
            op,
            workspaceId,
            fromTag: input.fromTag,
            toTag: input.toTag,
        });
    },
};
