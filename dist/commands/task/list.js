"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTasksAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.listTasksAction = {
    name: "list",
    describe: "Extract markdown checkboxes (tasks) from notes. Returns each checkbox with its note, line number, text, and completion status. Filterable by status (open/done/all), tag, or specific noteId.",
    mcpTool: "list_tasks",
    args: (cmd) => cmd
        .option("--status <s>", "Filter: open | done | all (default all)")
        .option("--tag <tag>", "Filter to notes with this tag")
        .option("--note-id <id>", "Filter to tasks from a specific note")
        .option("--limit <n>", "Max results (1-500, default 200)", (v) => parseInt(v, 10))
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        if (input.status &&
            input.status !== "all" &&
            input.status !== "open" &&
            input.status !== "done") {
            throw new Error("--status must be 'all', 'open', or 'done'");
        }
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.listTasks({
            workspaceId,
            status: input.status,
            tag: input.tag,
            noteId: input.noteId,
            limit: input.limit,
        });
    },
};
