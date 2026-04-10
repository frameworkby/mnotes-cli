"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSearchCommand = registerSearchCommand;
const config_1 = require("../config");
const client_1 = require("../client");
const output_1 = require("../output");
function registerSearchCommand(program) {
    program
        .command("search <query>")
        .description("Search notes")
        .option("--semantic", "Use semantic (vector) search instead of full-text")
        .option("--workspace-id <id>", "Workspace ID")
        .action(async (query, opts) => {
        const globalOpts = program.opts();
        const config = (0, config_1.resolveConfig)(globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const result = await client.searchNotes({
            query,
            mode: opts.semantic ? "semantic" : "fulltext",
            workspaceId: opts.workspaceId,
        });
        if (globalOpts.json) {
            (0, output_1.printJson)(result.data.results);
        }
        else {
            (0, output_1.printSearchResults)(result.data.results);
        }
    });
}
