"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodeAction = void 0;
const commander_1 = require("commander");
const config_1 = require("../../config");
const client_1 = require("../../client");
function parseMetadata(json) {
    if (!json)
        return undefined;
    try {
        const parsed = JSON.parse(json);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("--metadata must be a JSON object");
        }
        return parsed;
    }
    catch (err) {
        throw new Error(`--metadata is not valid JSON: ${err.message}`);
    }
}
exports.createNodeAction = {
    name: "create-node",
    describe: "Create a new graph node (note | tag | concept) in a workspace.",
    mcpTool: "create_node",
    args: (cmd) => cmd
        .option("--workspace-id <id>", "Workspace ID")
        .requiredOption("--label <s>", "Node label")
        .addOption(new commander_1.Option("--node-type <t>", "Node type").choices([
        "note",
        "tag",
        "concept",
    ]))
        .option("--note-id <id>", "Linked note ID (required if nodeType=note)")
        .option("--metadata <json>", "JSON object with extra metadata"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.createGraphNode({
            label: input.label,
            nodeType: input.nodeType,
            noteId: input.noteId,
            metadata: parseMetadata(input.metadata),
            workspaceId,
        });
    },
};
