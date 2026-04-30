import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  op: string;
  fromTag: string;
  toTag?: string;
  workspaceId?: string;
}

export const manageTagsAction: ActionDescriptor<Input, unknown> = {
  name: "manage",
  describe: "Rename, merge, or delete a tag across notes.",
  mcpTool: "manage_tags",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--op <op>", "rename | merge | delete")
      .requiredOption("--from-tag <s>", "Source tag")
      .option("--to-tag <s>", "Destination tag (rename, merge)")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) throw new Error("workspaceId is required");
    const op = input.op as "rename" | "merge" | "delete";
    if (op !== "rename" && op !== "merge" && op !== "delete") {
      throw new Error("--op must be one of: rename, merge, delete");
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.manageTags({
      op,
      workspaceId,
      fromTag: input.fromTag,
      toTag: input.toTag,
    });
  },
};
