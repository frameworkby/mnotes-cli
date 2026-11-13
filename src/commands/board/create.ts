import type { Command } from "commander";
import type { ActionDescriptor } from "../_register-group";
import type { BoardTask } from "../../client";
import { boardClient, collect, formatTask, parsePriority, parseStatus } from "./_shared";

interface CreateInput {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  noteId?: string[];
}

export const createBoardAction: ActionDescriptor<CreateInput, { task: BoardTask }> = {
  name: "create",
  describe: "Create a board task (default status: todo). It goes to the end of its column.",
  mcpTool: "board_create",
  positional: ["title"],
  args: (cmd: Command) =>
    cmd
      .argument("<title>", "Task title")
      .option("--description <md>", "Markdown description")
      .option("--status <s>", "backlog | todo | in_progress | review | done")
      .option("--priority <p>", "none | low | medium | high | urgent")
      .option("--assignee <name>", "Member or agent name, e.g. claude-code")
      .option("--note-id <id>", "Link a note (repeatable)", collect),

  run: async (input, ctx) => {
    const status = input.status ? parseStatus(input.status) : undefined;
    const priority = input.priority ? parsePriority(input.priority) : undefined;
    const { client, workspaceId } = boardClient(ctx.globalOpts);
    if (!workspaceId) {
      throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    }
    return client.createBoardTask({
      workspaceId,
      title: input.title,
      description: input.description,
      status,
      priority,
      assignee: input.assignee,
      noteIds: input.noteId,
    });
  },

  renderHuman: (output) => console.log(formatTask(output.task)),
};
