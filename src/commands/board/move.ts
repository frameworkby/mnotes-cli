import type { Command } from "commander";
import type { ActionDescriptor } from "../_register-group";
import type { BoardTask } from "../../client";
import { boardClient, formatTask, parseStatus } from "./_shared";

export const moveBoardAction: ActionDescriptor<{ id: string; status: string }, { task: BoardTask }> = {
  name: "move",
  describe: "Move a board task to another status column (appended to the end).",
  mcpTool: "board_move",
  positional: ["id", "status"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Task ID")
      .argument("<status>", "backlog | todo | in_progress (or in-progress) | review | done"),

  run: async (input, ctx) => {
    const status = parseStatus(input.status);
    return boardClient(ctx.globalOpts).client.updateBoardTask(input.id, { status });
  },

  renderHuman: (output) => console.log(formatTask(output.task)),
};
