"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frontmatterSetAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.frontmatterSetAction = {
    name: "frontmatter-set",
    describe: 'Set/merge YAML frontmatter fields. --fields is a JSON object, e.g. \'{"status":"draft"}\'.',
    mcpTool: "set_note_frontmatter",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Note ID")
        .requiredOption("--fields <json>", "JSON object of fields")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId)
            throw new Error("workspaceId is required");
        const fields = JSON.parse(input.fields);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.setNoteFrontmatter(input.id, { workspaceId, fields });
    },
};
