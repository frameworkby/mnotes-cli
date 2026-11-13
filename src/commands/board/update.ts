import type { Command } from "commander";
import type { ActionDescriptor } from "../_register-group";
import type { BoardTask, BoardTaskInput } from "../../client";
import { boardClient, collect, formatTask, parsePriority } from "./_shared";

interface UpdateInput {
  id: string;
  title?: string;
  description?: string;
  priority?: string;
  assignee?: string;
  unassign?: boolean;
  noteId?: string[];
}

export const updateBoardAction: ActionDescriptor<UpdateInput, { task: BoardTask }> = {
  name: "update",
  describe: "Update a board task's fields. Use `board move` to change status.",
  mcpTool: "board_update",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Task ID")
      .option("--title <title>", "New title")
      .option("--description <md>", "New markdown description")
      .option("--priority <p>", "none | low | medium | high | urgent")
      .option("--assignee <name>", "Assign to a member or agent name")
      .option("--unassign", "Clear the assignee")
      .option("--note-id <id>", "Replace linked notes (repeatable)", collect),

  run: async (input, ctx) => {
    if (input.assignee && input.unassign) {
      throw new Error("--assignee and --unassign are mutually exclusive");
    }
    const body: BoardTaskInput = {
      title: input.title,
      description: input.description,
      priority: input.priority ? parsePriority(input.priority) : undefined,
      assignee: input.unassign ? null : input.assignee,
      noteIds: input.noteId,
    };
    if (Object.values(body).every((v) => v === undefined)) {
      throw new Error("Nothing to update. Pass at least one of --title, --description, --priority, --assignee, --unassign, --note-id.");
    }
    return boardClient(ctx.globalOpts).client.updateBoardTask(input.id, body);
  },

  renderHuman: (output) => console.log(formatTask(output.task)),
};
