import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface Input {
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
      .option("--source <s>", "Optional source identifier"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
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
