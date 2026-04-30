"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkspaceAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
const login_1 = require("../login");
const output_1 = require("../../output");
exports.createWorkspaceAction = {
    name: "create",
    describe: "Create a new workspace",
    mcpTool: "create_workspace",
    args: (cmd) => cmd
        .requiredOption("--name <name>", "Workspace name")
        .option("--description <text>", "Workspace description"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const res = await client.createWorkspace(input.name, {
            description: input.description,
        });
        // Auto-link to current directory (mirrors legacy behavior).
        const stored = (0, login_1.readConfig)();
        if (stored) {
            const workspaces = stored.workspaces ?? {};
            workspaces[process.cwd()] = res.data.id;
            (0, login_1.writeConfig)({ ...stored, workspaces });
        }
        return res.data;
    },
    renderHuman: (output) => {
        (0, output_1.printSuccess)(`Created workspace ${output.name} [${output.slug}]`);
        (0, output_1.printSuccess)(`Linked ${process.cwd()} -> ${output.name}`);
    },
};
