import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SessionReplay } from "../../client";

interface ReplayInput {
  id: string;
}

export const sessionReplayAction: ActionDescriptor<ReplayInput, SessionReplay> = {
  name: "replay",
  describe:
    "Fetch a single session trace by ID, including all tool calls, affected note IDs, and timestamps.",
  mcpTool: "get_session_replay",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Session trace ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getSessionReplay(input.id, workspaceId);
  },
};
