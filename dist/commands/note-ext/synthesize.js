"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synthesizeAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.synthesizeAction = {
    name: "synthesize",
    describe: "Synthesize multiple notes into a single markdown document with wikilink citations. Accepts 2-20 note IDs, fetches their content, and generates a structured synthesis.",
    mcpTool: "synthesize_notes",
    args: (cmd) => cmd
        .requiredOption("--note-ids <csv>", "Comma-separated note IDs (2-20)")
        .option("--title <title>", "Optional title override for synthesised note"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const noteIds = input.noteIds
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        if (noteIds.length < 2) {
            throw new Error("--note-ids must include at least 2 IDs");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.synthesizeNotes({ noteIds, title: input.title, workspaceId });
    },
};
