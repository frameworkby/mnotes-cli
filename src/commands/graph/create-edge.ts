import { Option, type Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { GraphEdgeRecord } from "../../client";

interface CreateEdgeInput {
  sourceId: string;
  targetId: string;
  edgeType?: "wikilink" | "related" | "parent" | "tagged" | "custom";
  weight?: number;
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

export const createEdgeAction: ActionDescriptor<CreateEdgeInput, GraphEdgeRecord> = {
  name: "create-edge",
  describe: "Create a directed edge between two graph nodes.",
  mcpTool: "create_edge",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--source-id <id>", "Source node ID")
      .requiredOption("--target-id <id>", "Target node ID")
      .addOption(
        new Option("--edge-type <t>", "Edge type").choices([
          "wikilink",
          "related",
          "parent",
          "tagged",
          "custom",
        ]),
      )
      .option("--weight <n>", "Edge weight (0-10)", (v) => parseFloat(v))
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
    return client.createGraphEdge({
      sourceId: input.sourceId,
      targetId: input.targetId,
      edgeType: input.edgeType,
      weight: input.weight,
      metadata: parseMetadata(input.metadata),
      workspaceId,
    });
  },
};
