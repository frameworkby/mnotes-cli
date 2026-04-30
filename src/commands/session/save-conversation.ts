import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
  workspaceId?: string;
  messages: string;
  title?: string;
  source?: string;
}

export const saveConversationAction: ActionDescriptor<Input, unknown> = {
  name: "save-conversation",
  describe:
    'Save an AI conversation transcript as a new note. Pass --messages as a JSON array, e.g. \'[{"role":"user","content":"hi"}]\'.',
  mcpTool: "save_conversation",
  args: (cmd: Command) =>
    cmd
      .requiredOption(
        "--messages <json>",
        'JSON array: [{"role":"user|assistant","content":"..."}]',
      )
      .option("--title <s>", "Optional conversation title")
      .option("--source <s>", "Optional source identifier")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const messages = JSON.parse(input.messages) as Array<{
      role: "user" | "assistant";
      content: string;
    }>;
    const client = createClient(config.baseUrl, config.apiKey);
    return client.saveConversation({
      workspaceId,
      messages,
      title: input.title,
      source: input.source,
    });
  },
};
