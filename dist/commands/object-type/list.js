"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listObjectTypesAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.listObjectTypesAction = {
    name: "list",
    describe: "List all object types (supertags) in the current or specified workspace. Returns id, name, icon, color, property schema, and note count.",
    mcpTool: "list_object_types",
    args: (cmd) => cmd,
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.listObjectTypes(workspaceId);
    },
};
