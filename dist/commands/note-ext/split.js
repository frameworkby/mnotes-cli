"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitNoteAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.splitNoteAction = {
    name: "split",
    describe: "Use AI to split a long note into 2-10 focused sub-notes. Returns proposed splits without creating them — call create_note separately for each split you want to keep.",
    mcpTool: "split_note",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Note ID")
        .option("--split-point <n>", "Split point hint (currently unused by API)", (v) => parseInt(v, 10))
        .option("--title2 <title>", "Title hint for second split (currently unused by API)"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.splitNote(input.id, {
            workspaceId,
            splitPoint: input.splitPoint,
            title2: input.title2,
        });
    },
};
