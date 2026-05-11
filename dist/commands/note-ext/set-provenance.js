"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setProvenanceAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
const SOURCE_VALUES = ["url", "mcp_tool", "conversation", "manual"];
exports.setProvenanceAction = {
    name: "set-provenance",
    describe: "Append a provenance entry to a note, recording where the knowledge originated. Each entry has a source type (url, mcp_tool, conversation, manual) and a reference string.",
    mcpTool: "set_provenance",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Note ID")
        .requiredOption("--source <type>", `Source type (${SOURCE_VALUES.join("|")})`)
        .requiredOption("--ref <text>", "Reference string (e.g. URL, tool name)"),
    run: async (input, ctx) => {
        if (!SOURCE_VALUES.includes(input.source)) {
            throw new Error(`--source must be one of: ${SOURCE_VALUES.join(", ")}`);
        }
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.setProvenance(input.id, {
            source: input.source,
            ref: input.ref,
            workspaceId,
        });
    },
};
