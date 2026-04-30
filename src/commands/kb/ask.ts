import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { AskResult } from "../../client";

interface AskInput {
  workspaceId?: string;
  question: string;
  limit?: number;
}

export const askAction: ActionDescriptor<AskInput, AskResult> = {
  name: "ask",
  describe:
    "Ask a natural-language question against the knowledge base. Returns an answer with confidence score and supporting source excerpts.",
  mcpTool: "ask_notes",
  args: (cmd: Command) =>
    cmd
      .option("--workspace-id <id>", "Workspace ID")
      .requiredOption("--question <q>", "The question to ask")
      .option("--limit <n>", "Max sources to consider", (v) => parseInt(v, 10)),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.askNotes({
      question: input.question,
      workspaceId,
      limit: input.limit,
    });
  },
};
