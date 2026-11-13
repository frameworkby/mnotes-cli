import type { Command } from "commander";
import type { ActionDescriptor } from "../_register-group";
import type { BoardTask } from "../../client";
import { boardClient, formatTask, parseStatus } from "./_shared";

interface ListInput {
  status?: string;
  assignee?: string;
  q?: string;
  limit?: number;
}

export const listBoardAction: ActionDescriptor<ListInput, { tasks: BoardTask[] }> = {
  name: "list",
  describe: "List board tasks, ordered by status column then position.",
  mcpTool: "board_list",
  args: (cmd: Command) =>
    cmd
      .option("--status <list>", "Comma-separated statuses, e.g. todo,in_progress")
      .option("--assignee <name>", "Filter by assignee")
      .option("--q <text>", "Case-insensitive title/description search")
      .option("--limit <n>", "Max results (1-500, default 200)", (v) => parseInt(v, 10)),

  run: async (input, ctx) => {
    if (input.limit !== undefined && !(Number.isInteger(input.limit) && input.limit >= 1 && input.limit <= 500)) {
      throw new Error("--limit must be an integer 1-500");
    }
    const status = input.status?.split(",").filter((s) => s.trim()).map(parseStatus);
    const { client, workspaceId } = boardClient(ctx.globalOpts);
    if (!workspaceId) {
      throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    }
    return client.listBoardTasks({
      workspaceId,
      status,
      assignee: input.assignee,
      q: input.q,
      limit: input.limit,
    });
  },

  renderHuman: (output) => {
    if (output.tasks.length === 0) {
      process.stderr.write("No board tasks found.\n");
      return;
    }
    for (const t of output.tasks) console.log(formatTask(t));
  },
};
