import { Option, type Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { GraphNodeRecord } from "../../client";

interface CreateNodeInput {
  label: string;
  nodeType?: "note" | "tag" | "concept";
  noteId?: string;
  metadata?: string;
}

function parseMetadata(json?: string): Record<string, unknown> | undefined {
  if (!json) return undefined;
  try {
    const parsed = JSON.parse(json);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("--metadata must be a JSON object");
    }
    return parsed as Record<string, unknown>;
  } catch (err) {
    throw new Error(
      `--metadata is not valid JSON: ${(err as Error).message}`,
    );
  }
}

export const createNodeAction: ActionDescriptor<CreateNodeInput, GraphNodeRecord> = {
  name: "create-node",
  describe: "Create a new graph node (note | tag | concept) in a workspace.",
  mcpTool: "create_node",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--label <s>", "Node label")
      .addOption(
        new Option("--node-type <t>", "Node type").choices([
          "note",
          "tag",
          "concept",
        ]),
      )
      .option("--note-id <id>", "Linked note ID (required if nodeType=note)")
      .option("--metadata <json>", "JSON object with extra metadata"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.createGraphNode({
      label: input.label,
      nodeType: input.nodeType,
      noteId: input.noteId,
      metadata: parseMetadata(input.metadata),
      workspaceId,
    });
  },
};
