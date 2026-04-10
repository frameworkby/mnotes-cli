"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConfig = resolveConfig;
const login_1 = require("./commands/login");
function resolveConfig(opts) {
    // Priority: CLI flag > env var > stored config from `mnotes login`
    const stored = (0, login_1.readConfig)();
    const apiKey = opts.apiKey || process.env.MNOTES_API_KEY || stored?.apiKey;
    if (!apiKey) {
        process.stderr.write("Error: API key required. Use --api-key, set MNOTES_API_KEY, or run `mnotes login`\n");
        process.exit(1);
    }
    const baseUrl = opts.url || process.env.MNOTES_URL || stored?.serverUrl || "https://mnotes.framework.by";
    return { apiKey, baseUrl };
}
