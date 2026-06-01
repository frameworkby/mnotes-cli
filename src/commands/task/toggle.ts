import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { TaskToggleResult } from "../../client";

interface ToggleTaskInput {
  noteId: string;
  taskIndex: number;
  done?: boolean;
  notDone?: boolean;
}

export const toggleTaskAction: ActionDescriptor<
  ToggleTaskInput,
  TaskToggleResult
> = {
  name: "toggle",
  describe:
    "Toggle a markdown checkbox in a note between done and undone. Uses the line number reported by `task list` (1-based).",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--note-id <id>", "Note ID containing the task")
      .requiredOption(
        "--task-index <n>",
        "1-based line number of the checkbox (from `task list`)",
        (v) => parseInt(v, 10),
      )
      .option("--done", "Force the task to done")
      .option("--not-done", "Force the task to undone"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    if (input.done && input.notDone) {
      throw new Error("--done and --not-done are mutually exclusive");
    }
    let done: boolean | undefined;
    if (input.done) done = true;
    else if (input.notDone) done = false;

    const client = createClient(config.baseUrl, config.apiKey);
    return client.toggleTask({
      noteId: input.noteId,
      line: input.taskIndex,
      workspaceId,
      done,
    });
  },
};
