import type { Command } from "commander";
import type { ActionDescriptor } from "../_register-group";
import { printSuccess } from "../../output";
import { boardClient } from "./_shared";

export const deleteBoardAction: ActionDescriptor<{ id: string }, { id: string; deleted: true }> = {
  name: "delete",
  describe: "Delete a board task.",
  mcpTool: "board_delete",
  positional: ["id"],
  args: (cmd: Command) => cmd.argument("<id>", "Task ID"),

  run: async (input, ctx) => {
    await boardClient(ctx.globalOpts).client.deleteBoardTask(input.id);
    return { id: input.id, deleted: true as const };
  },

  renderHuman: (output) => printSuccess(`Deleted task ${output.id}`),
};
