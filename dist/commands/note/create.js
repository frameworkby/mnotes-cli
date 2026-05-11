"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNoteAction = void 0;
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
exports.createNoteAction = {
    name: "create",
    describe: "Create a new note",
    mcpTool: "create_note",
    args: (cmd) => cmd
        .requiredOption("--title <title>", "Note title")
        .option("--content <content>", "Note content (otherwise read from stdin)")
        .option("--folder <id>", "Folder ID")
        .option("--tags <tags...>", "Tags (space-separated)"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        let content = input.content;
        if (content === undefined && !process.stdin.isTTY) {
            const stdinContent = await readStdin();
            if (stdinContent.length > 0)
                content = stdinContent;
        }
        const res = await client.createNote({
            title: input.title,
            content,
            folderId: input.folder,
            tags: input.tags,
            workspaceId: config.workspaceId,
        });
        return res.data;
    },
    renderHuman: (output) => {
        (0, output_1.printSuccess)(`Created note ${output.id}: ${output.title}`);
    },
};
