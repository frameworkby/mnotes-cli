"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWsAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.setupWsAction = {
    name: "setup",
    describe: "Create a new workspace from a template (default: remedy-pod).",
    mcpTool: "setup_workspace",
    args: (cmd) => cmd
        .requiredOption("--name <s>", "Workspace name")
        .option("--template <s>", "Template id (default: remedy-pod)")
        .option("--description <s>", "Optional description")
        .option("--icon <s>", "Optional icon"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.setupWorkspace({
            name: input.name,
            template: input.template,
            description: input.description,
            icon: input.icon,
        });
    },
};
