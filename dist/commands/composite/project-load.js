"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectLoadAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.projectLoadAction = {
    name: "project-load",
    describe: "Composite tool: load project context (folder summary + recent notes + memory recall) in one call.",
    mcpTool: "project_context_load",
    args: (cmd) => cmd
        .option("--query <s>", "Optional semantic query")
        .option("--path <s>", "Optional folder path scope")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId)
            throw new Error("workspaceId is required");
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.projectContextLoad({
            workspaceId,
            query: input.query,
            path: input.path,
        });
    },
};
