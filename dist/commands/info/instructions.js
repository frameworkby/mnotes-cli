"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instructionsAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.instructionsAction = {
    name: "instructions",
    describe: "Generate setup instructions for an MCP-capable AI client (claude-code, claude-desktop, cursor, windsurf, vscode-copilot, generic).",
    mcpTool: "generate_agent_instructions",
    args: (cmd) => cmd
        .option("--client <s>", "Target client")
        .option("--base-url <url>", "Override base URL")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.generateAgentInstructions({
            workspaceId: input.workspaceId ?? config.workspaceId,
            client: input.client,
            baseUrl: input.baseUrl,
        });
    },
};
