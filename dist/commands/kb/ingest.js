"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestAction = void 0;
const node_fs_1 = require("node:fs");
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.ingestAction = {
    name: "ingest",
    describe: "Batch-import multiple knowledge entries in one call (max 50). Each entry is upserted by key — created if new, updated if the key already exists. All entries are validated before any writes; if any entry is invalid the entire batch is rejected.",
    mcpTool: "knowledge_ingest",
    args: (cmd) => cmd
        .option("--file <path>", "Path to a JSON file containing the entries array")
        .option("--entries <json>", "Inline JSON array of entries (alternative to --file)"),
    run: async (input, ctx) => {
        if (!input.file && !input.entries) {
            throw new Error("--file or --entries is required");
        }
        if (input.file && input.entries) {
            throw new Error("--file and --entries are mutually exclusive");
        }
        const raw = input.file
            ? (0, node_fs_1.readFileSync)(input.file, "utf8")
            : input.entries;
        let entries;
        try {
            entries = JSON.parse(raw);
        }
        catch (err) {
            throw new Error(`Invalid JSON in entries: ${err instanceof Error ? err.message : String(err)}`);
        }
        if (!Array.isArray(entries)) {
            throw new Error("Entries must be a JSON array");
        }
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.knowledgeIngest({ entries, workspaceId });
    },
};
