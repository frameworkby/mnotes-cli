"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.memoryAction = {
    name: "memory",
    describe: 'Store or update a single fact/memory by key. Use this when the user says "remember this" or you need to persist a fact across sessions. Creates a new entry if the key is new, or updates the existing one. Returns whether the entry was created or updated, and the previous content if it was an update (so you can detect what changed).',
    mcpTool: "memory_upsert",
    args: (cmd) => cmd
        .requiredOption("--key <key>", "Unique identifier for this memory")
        .requiredOption("--content <md>", "The fact or memory to store")
        .option("--source <s>", "Origin (e.g. user-stated, inferred)")
        .option("--confidence <n>", "Confidence 0.0–1.0", (v) => parseFloat(v))
        .option("--tags <csv>", "Comma-separated tags"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const tags = input.tags
            ? input.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : undefined;
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.memoryUpsert({
            key: input.key,
            content: input.content,
            workspaceId,
            source: input.source,
            confidence: input.confidence,
            tags,
        });
    },
};
