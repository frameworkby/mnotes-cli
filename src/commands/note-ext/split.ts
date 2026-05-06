import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SplitNoteResult } from "../../client";

interface Input {
  id: string;
  splitPoint?: number;
  title2?: string;
}

export const splitNoteAction: ActionDescriptor<Input, SplitNoteResult> = {
  name: "split",
  describe:
    "Use AI to split a long note into 2-10 focused sub-notes. Returns proposed splits without creating them — call create_note separately for each split you want to keep.",
  mcpTool: "split_note",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .option("--split-point <n>", "Split point hint (currently unused by API)", (v) =>
        parseInt(v, 10),
      )
      .option("--title2 <title>", "Title hint for second split (currently unused by API)"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.splitNote(input.id, {
      workspaceId,
      splitPoint: input.splitPoint,
      title2: input.title2,
    });
  },
};
