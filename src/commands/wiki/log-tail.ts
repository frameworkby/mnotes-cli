import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { WikiLogTailResult } from "../../client";

interface LogTailInput {
  limit?: string;
  json?: boolean;
}

function renderHuman(out: WikiLogTailResult): void {
  if (out.entries.length === 0) {
    process.stdout.write("(no entries)\n");
    return;
  }
  out.entries.forEach((entry, i) => {
    process.stdout.write(entry.raw);
    if (!entry.raw.endsWith("\n")) process.stdout.write("\n");
    if (i < out.entries.length - 1) process.stdout.write("\n");
  });
}

export const logTailAction: ActionDescriptor<LogTailInput, WikiLogTailResult> = {
  name: "tail",
  describe: "Show the most recent entries from the wiki activity log.",
  args: (cmd: Command) =>
    cmd
      .option("--limit <n>", "Number of entries to return (1..200, default 20)")
      .option("--json", "Emit full JSON envelope"),

  run: async (input, ctx) => {
    let limit: number | undefined;
    if (input.limit !== undefined) {
      const n = Number(input.limit);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 200) {
        process.stderr.write("Error: --limit must be an integer between 1 and 200\n");
        process.exit(1);
      }
      limit = n;
    }

    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.wikiLogTail({ workspaceId, limit });
  },

  renderHuman,
};
