"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdateCommand = registerUpdateCommand;
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
function registerUpdateCommand(program) {
    program
        .command("update <id>")
        .description("Update a note (reads new content from stdin)")
        .option("--title <title>", "New title")
        .action(async (id, opts) => {
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
        if (!opts.title && content === undefined) {
            process.stderr.write("Error: Provide --title and/or pipe content via stdin\n");
            process.exit(1);
        }
        const updateOpts = {};
        if (opts.title)
            updateOpts.title = opts.title;
        if (content !== undefined)
            updateOpts.content = content;
        const result = await client.updateNote(id, updateOpts);
        if (globalOpts.json) {
            (0, output_1.printJson)(result.data);
        }
        else {
            (0, output_1.printSuccess)(`Updated note ${result.data.id}: ${result.data.title}`);
        }
    });
}
