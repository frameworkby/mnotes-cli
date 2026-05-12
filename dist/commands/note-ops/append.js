"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.appendAction = {
    name: "append",
    describe: "Append content to the end of an existing note.",
    mcpTool: "append_to_note",
    positional: ["id"],
    args: (cmd) => cmd
        .arguments("[id]")
        .option("--id <id>", "Note ID (alias for positional)")
        .requiredOption("--content <text>", "Content to append"),
    run: async (input, ctx) => {
        if (!input.id) {
            process.stderr.write("Error: Note ID required — pass as positional or via --id <id>\n");
            process.exit(1);
        }
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId)
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.appendToNote(input.id, { workspaceId, content: input.content });
    },
};
