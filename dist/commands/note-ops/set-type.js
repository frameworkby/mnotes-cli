"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTypeAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.setTypeAction = {
    name: "set-type",
    describe: "Set the object-type for a note (e.g. 'task', 'meeting').",
    mcpTool: "set_note_type",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Note ID")
        .requiredOption("--type <s>", "Object type slug (or null to clear)")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId)
            throw new Error("workspaceId is required");
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.setNoteType(input.id, { workspaceId, type: input.type });
    },
};
