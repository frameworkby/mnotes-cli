"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReadCommand = registerReadCommand;
const config_1 = require("../config");
const client_1 = require("../client");
const output_1 = require("../output");
const telemetry_1 = require("../lib/telemetry");
function registerReadCommand(program) {
    program
        .command("read <id>")
        .description("Read a note by ID")
        .action(async (id) => {
        const globalOpts = program.opts();
        const config = (0, config_1.resolveConfig)(globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const result = await client.getNote(id);
        if (globalOpts.json) {
            (0, output_1.printJson)(result.data);
        }
        else {
            (0, output_1.printNote)(result.data);
        }
        const note = result.data;
        if ((0, telemetry_1.isDigestNote)({ title: note.title })) {
            void (0, telemetry_1.sendTelemetryEvent)({
                event: "digest_note_opened",
                props: {
                    source: "cli",
                    age_hours: (0, telemetry_1.bucketAgeHours)(note.createdAt),
                    session_index: (0, telemetry_1.nextDigestSessionIndex)(),
                },
            });
        }
    });
}
