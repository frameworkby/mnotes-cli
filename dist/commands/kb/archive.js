"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.archiveAction = {
    name: "archive",
    describe: "Archive stale knowledge entries.\n\n" +
        "Key-mode:       --key <key> or --keys <key1>,<key2>,...\n" +
        "Threshold-mode: --max-decay-score <n> --max-importance <n>\n\n" +
        "The two modes are mutually exclusive. Use --dry-run to preview without writing.",
    mcpTool: "archive_stale_memories",
    args: (cmd) => cmd
        .option("--key <key>", "Archive a single entry by its key")
        .option("--keys <csv>", "Archive multiple entries by comma-separated keys")
        .option("--max-decay-score <n>", "Only archive entries with decay score above this", (v) => parseFloat(v))
        .option("--max-importance <n>", "Only archive entries below this importance", (v) => parseFloat(v))
        .option("--dry-run", "Preview without writing"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        // Parse key list from --key and --keys (merge, deduplicate, drop empties)
        const rawKeys = [];
        if (input.key)
            rawKeys.push(input.key.trim());
        if (input.keys) {
            rawKeys.push(...input.keys
                .split(",")
                .map((k) => k.trim())
                .filter((k) => k.length > 0));
        }
        const resolvedKeys = [...new Set(rawKeys)];
        const isKeyMode = resolvedKeys.length > 0;
        // Validate: key-mode and threshold-mode are mutually exclusive
        const hasThresholds = input.maxDecayScore !== undefined || input.maxImportance !== undefined;
        if (isKeyMode && hasThresholds) {
            throw new Error("--key/--keys cannot be combined with --max-decay-score or --max-importance. " +
                "Use one mode at a time.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        if (isKeyMode) {
            const result = await client.archiveStaleMemories({
                workspaceId,
                keys: resolvedKeys,
                dryRun: input.dryRun,
            });
            // Report missing keys to stderr, then decide exit code
            if (result.missing && result.missing.length > 0) {
                for (const k of result.missing) {
                    process.stderr.write(`missing: ${k}\n`);
                }
                // Exit non-zero only if ALL keys were missing
                if (result.missing.length === resolvedKeys.length) {
                    process.exitCode = 1;
                }
            }
            return result;
        }
        // Threshold-mode (unchanged behaviour)
        return client.archiveStaleMemories({
            workspaceId,
            maxDecayScore: input.maxDecayScore,
            maxImportance: input.maxImportance,
            dryRun: input.dryRun,
        });
    },
};
