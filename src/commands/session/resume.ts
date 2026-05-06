import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SessionResumeResult } from "../../client";

interface ResumeInput {
  sessionId?: string;
  includeNotes?: boolean;
  noNotes?: boolean;
}

export const sessionResumeAction: ActionDescriptor<
  ResumeInput,
  SessionResumeResult
> = {
  name: "resume",
  describe:
    "Resume context from a previous session. Returns decisions, actions, tool-call summary, and (by default) affected notes for the most recent session, or a specified one.",
  mcpTool: "session_context_resume",
  args: (cmd: Command) =>
    cmd
      .option("--session-id <id>", "Session ID (defaults to most recent)")
      .option("--no-notes", "Skip including affected notes in the result"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    // Commander turns `--no-notes` into `notes: false`. Translate to API's
    // `include_notes: false`. When the flag is absent, leave undefined so the
    // server applies its default (include).
    const includeNotes =
      (input as { notes?: boolean }).notes === false ? false : undefined;
    const client = createClient(config.baseUrl, config.apiKey);
    return client.sessionContextResume({
      workspaceId,
      sessionId: input.sessionId,
      includeNotes,
    });
  },
};
