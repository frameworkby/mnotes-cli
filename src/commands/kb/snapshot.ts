import { Option, type Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SnapshotJson } from "../../client";

interface SnapshotInput {
  tags?: string;
  format?: "json" | "markdown";
}

export const snapshotAction: ActionDescriptor<
  SnapshotInput,
  SnapshotJson | { markdown: string }
> = {
  name: "snapshot",
  describe:
    "Export a snapshot of all knowledge entries in the workspace as JSON (default) or markdown. Optionally filter by tags.",
  mcpTool: "knowledge_snapshot",
  args: (cmd: Command) =>
    cmd
      .option("--tags <csv>", "Comma-separated tags filter")
      .addOption(
        new Option("--format <f>", "Output format")
          .choices(["json", "markdown"])
          .default("json"),
      ),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const tags = input.tags
      ? input.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : undefined;
    const client = createClient(config.baseUrl, config.apiKey);
    return client.knowledgeSnapshot({
      workspaceId,
      tags,
      format: input.format,
    });
  },
};
