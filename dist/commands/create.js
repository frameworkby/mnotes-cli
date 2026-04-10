"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCreateCommand = registerCreateCommand;
const config_1 = require("../config");
const client_1 = require("../client");
const output_1 = require("../output");
async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf-8");
}
function registerCreateCommand(program) {
    program
        .command("create")
        .description("Create a new note (reads content from stdin)")
        .requiredOption("--title <title>", "Note title")
        .option("--folder-id <id>", "Folder ID")
        .option("--workspace-id <id>", "Workspace ID")
        .action(async (opts) => {
        const globalOpts = program.opts();
        const config = (0, config_1.resolveConfig)(globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        let content;
        if (!process.stdin.isTTY) {
            content = await readStdin();
            if (content.length === 0) {
                content = undefined;
            }
        }
        const result = await client.createNote({
            title: opts.title,
            content,
            folderId: opts.folderId,
            workspaceId: opts.workspaceId || config.workspaceId,
        });
        if (globalOpts.json) {
            (0, output_1.printJson)(result.data);
        }
        else {
            (0, output_1.printSuccess)(`Created note ${result.data.id}: ${result.data.title}`);
        }
    });
}
