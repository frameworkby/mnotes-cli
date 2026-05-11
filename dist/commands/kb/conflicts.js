"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conflictsAction = void 0;
const commander_1 = require("commander");
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.conflictsAction = {
    name: "conflicts",
    describe: "List previously detected knowledge conflicts. Filter by classification (contradicting, complementary, unrelated, or all).",
    mcpTool: "get_knowledge_conflicts",
    args: (cmd) => cmd
        .addOption(new commander_1.Option("--classification <c>", "Filter by classification").choices([
        "contradicting",
        "complementary",
        "unrelated",
        "all",
    ])),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.getKnowledgeConflicts({
            workspaceId,
            classification: input.classification,
        });
    },
};
