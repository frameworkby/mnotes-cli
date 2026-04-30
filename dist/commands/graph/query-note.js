"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryNoteGraphAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.queryNoteGraphAction = {
    name: "query-note",
    describe: "Return the local graph (neighbors and edges) around the graph node linked to a note.",
    mcpTool: "query_note_graph",
    args: (cmd) => cmd
        .option("--workspace-id <id>", "Workspace ID")
        .requiredOption("--note-id <id>", "Note ID")
        .option("--depth <n>", "Neighborhood depth (1-3)", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.queryNoteGraph({
            noteId: input.noteId,
            depth: input.depth,
            workspaceId,
        });
    },
};
