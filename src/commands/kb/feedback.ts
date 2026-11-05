import { Option, type Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { AnswerFeedbackResult } from "../../client";

interface FeedbackInput {
  answerId: string;
  rating: "up" | "down" | "clear";
  comment?: string;
}

export const feedbackAction: ActionDescriptor<FeedbackInput, { data: AnswerFeedbackResult }> = {
  name: "feedback",
  describe:
    "Rate a `kb ask` answer by its answerId. Ratings nudge which notes rank first in later answers; re-rating replaces the previous rating.\n\n" +
    "  mnotes kb feedback <answerId> --rating up\n" +
    "  mnotes kb feedback <answerId> --rating clear",
  mcpTool: "answer_feedback",
  positional: ["answerId"],
  args: (cmd: Command) =>
    cmd
      .argument("<answerId>", "answerId from `mnotes kb ask --json`")
      .addOption(
        new Option("--rating <r>", "Rating").choices(["up", "down", "clear"]).makeOptionMandatory(),
      )
      .option("--comment <text>", "Optional comment (max 1000 chars)"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.answerFeedback({
      workspaceId,
      answerId: input.answerId,
      rating: input.rating,
      comment: input.comment,
    });
  },
};
