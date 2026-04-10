"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerListCommand = registerListCommand;
const config_1 = require("../config");
const client_1 = require("../client");
const output_1 = require("../output");
function registerListCommand(program) {
    program
        .command("list")
        .description("List notes")
        .option("--workspace-id <id>", "Workspace ID")
        .option("--folder-id <id>", "Folder ID")
        .option("--cursor <cursor>", "Pagination cursor")
        .option("--limit <n>", "Max notes to return", parseInt)
        .action(async (opts) => {
        const globalOpts = program.opts();
        const config = (0, config_1.resolveConfig)(globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const result = await client.listNotes({
            workspaceId: opts.workspaceId,
            folderId: opts.folderId,
            cursor: opts.cursor,
            limit: opts.limit,
        });
        if (globalOpts.json) {
            (0, output_1.printJson)(result);
        }
        else {
            (0, output_1.printNoteList)(result.data);
            if (result.nextCursor) {
                process.stderr.write(`\nMore results available. Use --cursor ${result.nextCursor}\n`);
            }
        }
    });
}
