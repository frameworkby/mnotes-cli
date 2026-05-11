"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEdgeAction = void 0;
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
exports.createEdgeAction = {
    name: "create-edge",
    describe: "Create a directed edge between two graph nodes.",
    mcpTool: "create_edge",
    args: (cmd) => cmd
        .requiredOption("--source-id <id>", "Source node ID")
        .requiredOption("--target-id <id>", "Target node ID")
        .addOption(new commander_1.Option("--edge-type <t>", "Edge type").choices([
        "wikilink",
        "related",
        "parent",
        "tagged",
        "custom",
    ]))
        .option("--weight <n>", "Edge weight (0-10)", (v) => parseFloat(v))
        .option("--metadata <json>", "JSON object with extra metadata"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.createGraphEdge({
            sourceId: input.sourceId,
            targetId: input.targetId,
            edgeType: input.edgeType,
            weight: input.weight,
            metadata: parseMetadata(input.metadata),
            workspaceId,
        });
    },
};
