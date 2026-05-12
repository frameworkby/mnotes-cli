"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNoteAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
const output_1 = require("../../output");
async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf-8");
}
exports.updateNoteAction = {
    name: "update",
    describe: "Update a note",
    mcpTool: "update_note",
    positional: ["id"],
    args: (cmd) => cmd
        .arguments("[id]")
        .option("--id <id>", "Note ID (alias for positional)")
        .option("--title <title>", "New title")
        .option("--content <content>", "New content (otherwise read from stdin)")
        .option("--folder <id>", "New folder ID")
        .option("--tags <tags...>", "Replace tags (space-separated)"),
    run: async (input, ctx) => {
        if (!input.id) {
            process.stderr.write("Error: Note ID required — pass as positional or via --id <id>\n");
            process.exit(1);
        }
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        let content = input.content;
        if (content === undefined && !process.stdin.isTTY) {
            const stdinContent = await readStdin();
            if (stdinContent.length > 0)
                content = stdinContent;
        }
        const opts = {};
        if (input.title !== undefined)
            opts.title = input.title;
        if (content !== undefined)
            opts.content = content;
        if (input.folder !== undefined)
            opts.folderId = input.folder;
        if (input.tags !== undefined)
            opts.tags = input.tags;
        if (Object.keys(opts).length === 0) {
            process.stderr.write("Error: provide at least one of --title, --content, --folder, --tags (or pipe content via stdin)\n");
            process.exit(1);
        }
        const res = await client.updateNote(input.id, opts);
        return res.data;
    },
    renderHuman: (output) => {
        (0, output_1.printSuccess)(`Updated note ${output.id}: ${output.title}`);
    },
};
