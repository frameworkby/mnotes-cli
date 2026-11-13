import type { Command } from "commander";
import type { ActionDescriptor } from "../_register-group";
import type { BoardComment } from "../../client";
import { printSuccess } from "../../output";
import { boardClient } from "./_shared";

export const commentBoardAction: ActionDescriptor<{ id: string; body: string }, { comment: BoardComment }> = {
  name: "comment",
  describe: "Add a comment to a board task's activity log.",
  mcpTool: "board_comment",
  positional: ["id", "body"],
  args: (cmd: Command) => cmd.argument("<id>", "Task ID").argument("<body>", "Comment text (markdown)"),

  run: async (input, ctx) => {
    if (!input.body.trim()) throw new Error("Comment body must not be empty");
    return boardClient(ctx.globalOpts).client.commentBoardTask(input.id, input.body);
  },

  renderHuman: (output) => printSuccess(`Commented on task ${output.comment.taskId}`),
};
