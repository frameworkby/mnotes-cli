import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SynthesizeNotesResult } from "../../client";

interface Input {
  noteIds: string;
  title?: string;
  workspaceId?: string;
}

export const synthesizeAction: ActionDescriptor<Input, SynthesizeNotesResult> = {
  name: "synthesize",
  describe:
    "Synthesize multiple notes into a single markdown document with wikilink citations. Accepts 2-20 note IDs, fetches their content, and generates a structured synthesis.",
  mcpTool: "synthesize_notes",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--note-ids <csv>", "Comma-separated note IDs (2-20)")
      .option("--title <title>", "Optional title override for synthesised note")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const noteIds = input.noteIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (noteIds.length < 2) {
      throw new Error("--note-ids must include at least 2 IDs");
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.synthesizeNotes({ noteIds, title: input.title, workspaceId });
  },
};
