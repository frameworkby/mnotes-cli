import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SmartFolder } from "../../client";

interface CreateSmartFolderInput {
  name: string;
  query: string;
  mode: "fulltext" | "semantic";
  workspaceId?: string;
}

export const createSmartFolderAction: ActionDescriptor<
  CreateSmartFolderInput,
  SmartFolder
> = {
  name: "create",
  describe:
    "Create a smart folder (saved search) with a name, query, and search mode (fulltext or semantic).",
  mcpTool: "create_smart_folder",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--name <name>", "Smart folder name")
      .requiredOption("--query <q>", "Search query")
      .requiredOption("--mode <m>", "Search mode: fulltext or semantic")
      .option("--workspace-id <id>", "Workspace ID"),

  run: async (input, ctx) => {
    if (input.mode !== "fulltext" && input.mode !== "semantic") {
      throw new Error("--mode must be 'fulltext' or 'semantic'");
    }
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.createSmartFolder({
      workspaceId,
      name: input.name,
      query: input.query,
      mode: input.mode,
    });
  },
};
