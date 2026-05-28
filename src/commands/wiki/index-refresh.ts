import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { WikiIndexRefreshResult } from "../../client";

interface IndexRefreshInput {
  json?: boolean;
}

function renderHuman(out: WikiIndexRefreshResult): void {
  process.stdout.write(
    `index refresh — added=${out.added} removed=${out.removed} unchanged=${out.unchanged} total=${out.total}\n`,
  );
}

export const indexRefreshAction: ActionDescriptor<IndexRefreshInput, WikiIndexRefreshResult> = {
  name: "refresh",
  describe: "Rebuild the wiki index.md from current workspace notes.",
  args: (cmd: Command) => cmd.option("--json", "Emit full JSON envelope"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.wikiIndexRefresh(workspaceId);
  },

  renderHuman,
};
