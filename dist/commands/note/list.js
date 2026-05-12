"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
const output_1 = require("../../output");
exports.listAction = {
    name: "list",
    describe: "List notes",
    mcpTool: "list_notes",
    aliases: ["list"], // legacy `mnotes list`
    args: (cmd) => cmd
        .option("--folder-id <id>", "Folder ID")
        .option("--folder <id>", "Alias for --folder-id")
        .option("--cursor <cursor>", "Pagination cursor")
        .option("--limit <n>", "Max notes to return", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const folderId = input.folderId ?? input.folder;
        const apiResp = await client.listNotes({
            workspaceId: config.workspaceId,
            folderId,
            cursor: input.cursor,
            limit: input.limit,
        });
        // Reshape API response (`{ data, nextCursor }`) into MCP `list_notes` shape
        // (`{ notes, nextCursor }`). This is the parity contract: top-level keys
        // match the MCP tool's response.
        return {
            notes: apiResp.data,
            nextCursor: apiResp.nextCursor,
        };
    },
    renderHuman: (output) => {
        (0, output_1.printNoteList)(output.notes);
        if (output.nextCursor) {
            process.stderr.write(`\nMore results available. Use --cursor ${output.nextCursor}\n`);
        }
    },
};
