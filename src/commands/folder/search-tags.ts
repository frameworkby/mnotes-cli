import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { TaggedNoteItem } from "../../client";

interface SearchTagsInput {
  tags: string;
  match?: "any" | "all";
  limit?: number;
  workspaceId?: string;
}

export const folderSearchTagsAction: ActionDescriptor<
  SearchTagsInput,
  TaggedNoteItem[]
> = {
  name: "search-tags",
  // Mirrored verbatim from MCP `search_by_tags` description.
  describe:
    'Find notes matching given tags. Use match="any" (default) to find notes with at least one of the tags, or match="all" to find notes that have every specified tag.',
  // Mounted under `folder` to match the MCP grouping (folder-tools.ts owns this
  // tool even though it returns notes). Operator-confirmed naming choice.
  mcpTool: "search_by_tags",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--tags <list>", "Comma-separated tags (at least one)")
      .option("--match <mode>", "any | all (default any)")
      .option("--limit <n>", "Max results (default 50, max 100)", (v) =>
        parseInt(v, 10),
      )
      .option("--workspace-id <id>", "Workspace ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error("workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)");
    }
    const tags = input.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length === 0) {
      throw new Error("--tags must contain at least one non-empty tag");
    }
    const match = input.match ?? "any";
    if (match !== "any" && match !== "all") {
      throw new Error('--match must be "any" or "all"');
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.searchByTags({
      tags,
      workspaceId,
      match,
      limit: input.limit,
    });
  },
};
