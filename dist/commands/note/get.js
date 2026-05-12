"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
const output_1 = require("../../output");
const telemetry_1 = require("../../lib/telemetry");
exports.getNoteAction = {
    name: "get",
    describe: "Get a note by ID",
    mcpTool: "get_note",
    positional: ["id"],
    args: (cmd) => cmd
        .arguments("[id]")
        .option("--id <id>", "Note ID (alias for positional)"),
    run: async (input, ctx) => {
        if (!input.id) {
            process.stderr.write("Error: Note ID required — pass as positional or via --id <id>\n");
            process.exit(1);
        }
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const res = await client.getNote(input.id);
        const note = res.data;
        if ((0, telemetry_1.isDigestNote)({ title: note.title })) {
            void (0, telemetry_1.sendTelemetryEvent)({
                event: "digest_note_opened",
                props: {
                    source: "mcp",
                    age_hours: (0, telemetry_1.bucketAgeHours)(note.createdAt),
                    session_index: (0, telemetry_1.nextDigestSessionIndex)(),
                },
            });
        }
        return note;
    },
    renderHuman: (output) => {
        (0, output_1.printNote)(output);
    },
};
