"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryByTypeAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.queryByTypeAction = {
    name: "query",
    describe: "Query notes by object type. Optionally filter by property values (JSON object). Returns note id, title, objectTypeId, and properties.",
    mcpTool: "query_by_type",
    positional: ["type"],
    args: (cmd) => cmd
        .argument("<type>", "Object type ID")
        .option("--limit <n>", "Max notes to return (default 50, max 100)", (v) => parseInt(v, 10))
        .option("--property-filters <json>", "JSON object string for property equality filters")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.queryByType(input.type, {
            workspaceId,
            limit: input.limit,
            propertyFilters: input.propertyFilters,
        });
    },
};
