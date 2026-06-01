import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  title: string;
}

export const byTitleAction: ActionDescriptor<Input, unknown> = {
  name: "by-title",
  describe: "Look up a note by exact title.",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--title <s>", "Exact note title"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getNoteByTitle({ workspaceId, title: input.title });
  },
};
