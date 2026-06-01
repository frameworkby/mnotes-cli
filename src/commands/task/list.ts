import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { TaskItem } from "../../client";

interface ListTasksInput {
  status?: "all" | "open" | "done";
  tag?: string;
  noteId?: string;
  limit?: number;
}

export const listTasksAction: ActionDescriptor<ListTasksInput, TaskItem[]> = {
  name: "list",
  describe:
    "Extract markdown checkboxes (tasks) from notes. Returns each checkbox with its note, line number, text, and completion status. Filterable by status (open/done/all), tag, or specific noteId.",
  args: (cmd: Command) =>
    cmd
      .option(
        "--status <s>",
        "Filter: open | done | all (default all)",
      )
      .option("--tag <tag>", "Filter to notes with this tag")
      .option("--note-id <id>", "Filter to tasks from a specific note")
      .option("--limit <n>", "Max results (1-500, default 200)", (v) =>
        parseInt(v, 10),
      ),

  run: async (input, ctx) => {
    if (
      input.status &&
      input.status !== "all" &&
      input.status !== "open" &&
      input.status !== "done"
    ) {
      throw new Error("--status must be 'all', 'open', or 'done'");
    }
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.listTasks({
      workspaceId,
      status: input.status,
      tag: input.tag,
      noteId: input.noteId,
      limit: input.limit,
    });
  },
};
