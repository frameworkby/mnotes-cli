"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWsAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.updateWsAction = {
    name: "update",
    describe: "Update a workspace's name, description, or icon.",
    mcpTool: "update_workspace",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Workspace ID")
        .option("--name <s>", "New name")
        .option("--description <s>", "New description")
        .option("--icon <s>", "New icon"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.updateWorkspace(input.id, {
            name: input.name,
            description: input.description,
            icon: input.icon,
        });
    },
};
