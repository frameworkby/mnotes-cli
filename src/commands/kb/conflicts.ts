import { Option, type Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { ConflictRow } from "../../client";

interface ConflictsInput {
  classification?: "contradicting" | "complementary" | "unrelated" | "all";
}

export const conflictsAction: ActionDescriptor<ConflictsInput, ConflictRow[]> = {
  name: "conflicts",
  describe:
    "List previously detected knowledge conflicts. Filter by classification (contradicting, complementary, unrelated, or all).",
  mcpTool: "get_knowledge_conflicts",
  args: (cmd: Command) =>
    cmd
      .addOption(
        new Option("--classification <c>", "Filter by classification").choices([
          "contradicting",
          "complementary",
          "unrelated",
          "all",
        ]),
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
    return client.getKnowledgeConflicts({
      workspaceId,
      classification: input.classification,
    });
  },
};
