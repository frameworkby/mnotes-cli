import type { Command } from "commander";
import type { ActionDescriptor } from "../_register-group";
import type { BoardComment, BoardTask } from "../../client";
import { boardClient, formatTask } from "./_shared";

export const showBoardAction: ActionDescriptor<
  { id: string },
  { task: BoardTask; comments: BoardComment[] }
> = {
  name: "show",
  describe: "Show a board task with its comments and activity (oldest first).",
  mcpTool: "board_show",
  positional: ["id"],
  args: (cmd: Command) => cmd.argument("<id>", "Task ID"),

  run: async (input, ctx) => boardClient(ctx.globalOpts).client.getBoardTask(input.id),

  renderHuman: ({ task, comments }) => {
    console.log(formatTask(task));
    for (const n of task.notes) console.log(`  note: ${n.id}  ${n.title}`);
    if (task.description) console.log(`\n${task.description}`);
    if (comments.length > 0) {
      console.log("\nActivity:");
      for (const c of comments) {
        const when = new Date(c.createdAt).toLocaleString();
        const actor = c.actorType === "agent" ? `${c.actor} (agent)` : c.actor;
        console.log(c.kind === "event" ? `  ${when}  ${actor} ${c.body}` : `  ${when}  ${actor}: ${c.body}`);
      }
    }
  },
};
