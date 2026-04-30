"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.storeAction = {
    name: "store",
    describe: "Store a structured knowledge entry (fact, decision, or context) that persists across sessions. Creates a new entry when the key is new, or updates the existing entry when the key already exists for the user+workspace. Knowledge entries are searchable via search_notes but hidden from the UI sidebar.",
    mcpTool: "knowledge_store",
    args: (cmd) => cmd
        .requiredOption("--key <key>", "Unique identifier for this entry")
        .requiredOption("--content <md>", "Markdown content of the entry")
        .option("--source <s>", "Origin (e.g. user-stated, inferred)")
        .option("--confidence <n>", "Confidence 0.0–1.0", (v) => parseFloat(v))
        .option("--tags <csv>", "Comma-separated tags")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const tags = input.tags
            ? input.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : undefined;
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.knowledgeStore({
            key: input.key,
            content: input.content,
            workspaceId,
            source: input.source,
            confidence: input.confidence,
            tags,
        });
    },
};
