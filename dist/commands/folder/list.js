"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFoldersAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.listFoldersAction = {
    name: "list",
    // Mirrored verbatim from MCP `list_folders` description.
    describe: "List folders for the authenticated user with their hierarchy (parent-child relationships) and note counts. Supports cursor-based pagination.",
    mcpTool: "list_folders",
    args: (cmd) => cmd
        .option("--workspace-id <id>", "Workspace ID")
        .option("--cursor <cursor>", "Pagination cursor")
        .option("--limit <n>", "Max folders per page (default 50, max 100)", (v) => parseInt(v, 10)),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.listFolders({
            workspaceId,
            cursor: input.cursor,
            limit: input.limit,
        });
    },
    renderHuman: (output) => {
        if (output.folders.length === 0) {
            process.stderr.write("No folders found.\n");
            return;
        }
        const idW = Math.max(2, ...output.folders.map((f) => f.id.length));
        const nameW = Math.max(4, ...output.folders.map((f) => f.name.length));
        console.log(`${"ID".padEnd(idW)}  ${"NAME".padEnd(nameW)}  NOTES  ROOT`);
        for (const f of output.folders) {
            console.log(`${f.id.padEnd(idW)}  ${f.name.padEnd(nameW)}  ${String(f.noteCount).padStart(5)}  ${f.isRoot ? "yes" : "no"}`);
        }
        if (output.nextCursor) {
            process.stderr.write(`\nMore results available. Use --cursor ${output.nextCursor}\n`);
        }
    },
};
