import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

interface DeleteEmptyInput {
  dryRun?: boolean;
  folder?: string;
}

interface DeleteEmptyOutput {
  candidates: string[];
  deleted: string[];
  failed: Array<{ id: string; error: string }>;
}

const MAX_DISPLAY = 10;

function truncatedList(ids: string[], label: string): void {
  if (ids.length === 0) return;
  console.log(`\n${label} (${ids.length}):`);
  const shown = ids.slice(0, MAX_DISPLAY);
  for (const id of shown) {
    console.log(`  ${id}`);
  }
  const remaining = ids.length - shown.length;
  if (remaining > 0) {
    console.log(`  +${remaining} more`);
  }
}

export const deleteEmptyFoldersAction: ActionDescriptor<DeleteEmptyInput, DeleteEmptyOutput> = {
  name: "delete-empty",
  describe:
    "Delete all recursively-empty folders in the workspace (no notes anywhere in their subtree). Use --dry-run to preview, --folder to scope to a subtree.",
  mcpTool: "delete_empty_folders",

  args: (cmd: Command) =>
    cmd
      .option("--dry-run", "List candidate folders without deleting them")
      .option("--folder <id>", "Scope cleanup to a specific folder subtree"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
    }
    const client = createClient(config.baseUrl, config.apiKey);

    const { folderIds } = await client.listEmptyFolders({
      workspaceId,
      folderId: input.folder,
    });

    if (input.dryRun || folderIds.length === 0) {
      return { candidates: folderIds, deleted: [], failed: [] };
    }

    const deleted: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    // folderIds already sorted deepest-first by the server, safe to delete in order.
    for (const id of folderIds) {
      try {
        await client.deleteFolder(id);
        deleted.push(id);
      } catch (err) {
        failed.push({ id, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return { candidates: folderIds, deleted, failed };
  },

  renderHuman: (output, input) => {
    const { candidates, deleted, failed } = output;

    if (input?.dryRun) {
      if (candidates.length === 0) {
        process.stderr.write("No empty folders found.\n");
        return;
      }
      console.log(`delete-empty — dry-run, candidates=${candidates.length}`);
      truncatedList(candidates, "Candidates");
      return;
    }

    if (candidates.length === 0) {
      process.stderr.write("No empty folders found.\n");
      return;
    }

    console.log(
      `delete-empty — candidates=${candidates.length} deleted=${deleted.length} failed=${failed.length}`,
    );

    truncatedList(deleted, "Deleted");

    if (failed.length > 0) {
      console.log(`\nFailed (${failed.length}):`);
      const shown = failed.slice(0, MAX_DISPLAY);
      for (const f of shown) {
        console.log(`  ${f.id}: ${f.error}`);
      }
      const remaining = failed.length - shown.length;
      if (remaining > 0) {
        console.log(`  +${remaining} more`);
      }
    }
  },
};
