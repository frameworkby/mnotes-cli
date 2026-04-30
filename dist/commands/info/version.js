"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.versionAction = {
    name: "version",
    describe: "Show the m-notes server version (no auth required for the route, but client uses configured key).",
    mcpTool: "get_version",
    args: (cmd) => cmd,
    run: async (_input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.getVersion();
    },
};
