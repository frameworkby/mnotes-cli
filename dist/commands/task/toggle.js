"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleTaskAction = void 0;
const config_1 = require("../../config");
const client_1 = require("../../client");
exports.toggleTaskAction = {
    name: "toggle",
    describe: "Toggle a markdown checkbox in a note between done and undone. Uses the line number reported by `task list` (1-based).",
    mcpTool: "toggle_task",
    args: (cmd) => cmd
        .requiredOption("--note-id <id>", "Note ID containing the task")
        .requiredOption("--task-index <n>", "1-based line number of the checkbox (from `task list`)", (v) => parseInt(v, 10))
        .option("--done", "Force the task to done")
        .option("--not-done", "Force the task to undone")
        .option("--workspace-id <id>", "Workspace ID"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = input.workspaceId ?? config.workspaceId;
        if (!workspaceId) {
            throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
        }
        if (input.done && input.notDone) {
            throw new Error("--done and --not-done are mutually exclusive");
        }
        let done;
        if (input.done)
            done = true;
        else if (input.notDone)
            done = false;
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.toggleTask({
            noteId: input.noteId,
            line: input.taskIndex,
            workspaceId,
            done,
        });
    },
};
