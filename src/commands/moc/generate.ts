import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { MocResult } from "../../client";

interface GenerateMocInput {
  scopeType: "folder" | "tag";
  scopeId: string;
  limit?: number;
  workspaceId?: string;
}

export const generateMocAction: ActionDescriptor<GenerateMocInput, MocResult> = {
  name: "generate",
  describe:
    "Generate a Map of Content (MoC) note for a folder or tag. Notes are ordered by embedding similarity and each line is a wikilink with a one-sentence description. Re-running updates the existing MoC.",
  mcpTool: "generate_moc",
  args: (cmd: Command) =>
    cmd
      .requiredOption(
        "--scope-type <type>",
        "Scope type: folder or tag",
      )
      .requiredOption("--scope-id <id>", "Folder ID or tag name")
      .option("--limit <n>", "Max notes (1-200, default 50)", (v) =>
        parseInt(v, 10),
      )
      .option("--workspace-id <id>", "Workspace ID"),

  run: async (input, ctx) => {
    if (input.scopeType !== "folder" && input.scopeType !== "tag") {
      throw new Error("--scope-type must be 'folder' or 'tag'");
    }
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.generateMoc({
      workspaceId,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      limit: input.limit,
    });
  },
};
