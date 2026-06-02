import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { GraphExtractResult } from "../../client";

interface ExtractInput {
  full?: boolean;
}

export const extractFactsAction: ActionDescriptor<ExtractInput, GraphExtractResult> = {
  name: "extract",
  describe:
    "Extract bi-temporal facts from notes (backfill). By default only notes not yet extracted; --full re-scans all.",
  args: (cmd: Command) => cmd.option("--full", "Re-extract all notes, not just new ones"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.graphExtract({ workspaceId, full: input.full });
  },

  renderHuman: (output) =>
    console.log(`Extracted ${output.facts} facts across ${output.episodes} episodes`),
};
