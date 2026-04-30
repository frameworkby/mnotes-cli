import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SessionListResult } from "../../client";

interface ListSessionsInput {
  workspaceId?: string;
  limit?: number;
  cursor?: string;
}

export const listSessionsAction: ActionDescriptor<
  ListSessionsInput,
  SessionListResult
> = {
  name: "list",
  describe:
    "List recent session traces for the user (paginated). Returns id, sessionLabel, startedAt, endedAt, toolCallCount, and noteIds.",
  mcpTool: "list_sessions",
  args: (cmd: Command) =>
    cmd
      .option("--workspace-id <id>", "Workspace ID")
      .option("--limit <n>", "Max results (1-50, default 20)", (v) =>
        parseInt(v, 10),
      )
      .option("--cursor <id>", "Pagination cursor"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    const client = createClient(config.baseUrl, config.apiKey);
    return client.listSessions({
      workspaceId,
      limit: input.limit,
      cursor: input.cursor,
    });
  },
};
