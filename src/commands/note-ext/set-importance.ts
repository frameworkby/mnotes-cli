import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SetImportanceResult } from "../../client";

interface Input {
  id: string;
  importance: number;
}

export const setImportanceAction: ActionDescriptor<Input, SetImportanceResult> = {
  name: "set-importance",
  describe:
    "Set the importance score for a knowledge entry or note. Importance influences retrieval ranking in recall_knowledge — higher importance entries surface first.",
  mcpTool: "set_importance",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .requiredOption("--importance <n>", "Importance score (0-1)", (v) =>
        parseFloat(v),
      ),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.setImportance(input.id, {
      importance: input.importance,
      workspaceId,
    });
  },
};
