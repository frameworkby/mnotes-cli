"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listWorkspacesAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
const login_1 = require("../login");
exports.listWorkspacesAction = {
    name: "list",
    describe: "List all workspaces",
    mcpTool: "list_workspaces",
    run: async (_input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const res = await client.listWorkspaces();
        return { workspaces: res.data };
    },
    renderHuman: (output) => {
        const stored = (0, login_1.readConfig)();
        const cwd = process.cwd();
        const dirMapped = stored?.workspaces?.[cwd];
        const globalDefault = stored?.workspaceId;
        if (output.workspaces.length === 0) {
            console.log("No workspaces found. Create one with: mnotes workspace create --name <name>");
            return;
        }
        for (const w of output.workspaces) {
            const markers = [];
            if (w.isDefault)
                markers.push("default");
            if (w.id === dirMapped)
                markers.push("linked");
            else if (w.id === globalDefault)
                markers.push("global");
            const suffix = markers.length > 0 ? `  (${markers.join(", ")})` : "";
            console.log(`  ${w.name} [${w.slug}] (id: ${w.id})${suffix}`);
        }
    },
};
