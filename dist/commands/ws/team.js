"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.teamAction = {
    name: "team",
    describe: "List members of a workspace.",
    mcpTool: "list_team_members",
    positional: ["id"],
    args: (cmd) => cmd.argument("<id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.listTeamMembers(input.id);
    },
};
