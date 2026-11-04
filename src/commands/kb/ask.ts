import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { AskResult } from "../../client";

interface AskInput {
  question: string;
  limit?: number;
  contextOnly?: boolean;
}

export const askAction: ActionDescriptor<AskInput, AskResult> = {
  name: "ask",
  describe:
    "Ask a natural-language question against the knowledge base. Returns an answer with confidence score and supporting source excerpts. With --context-only, returns the retrieved context (answer: null) without calling the LLM.",
  mcpTool: "ask_notes",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--question <q>", "The question to ask")
      .option("--limit <n>", "Max sources to consider", (v) => parseInt(v, 10))
      .option("--context-only", "Return retrieved context without calling the LLM"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.askNotes({
      question: input.question,
      workspaceId,
      limit: input.limit,
      ...(input.contextOnly ? { contextOnly: true } : {}),
    });
  },
};
