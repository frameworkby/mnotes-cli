import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { MemoryUpsertResult } from "../../client";

interface MemoryInput {
  key: string;
  content: string;
  source?: string;
  confidence?: number;
  tags?: string;
  workspaceId?: string;
}

export const memoryAction: ActionDescriptor<MemoryInput, MemoryUpsertResult> = {
  name: "memory",
  describe:
    'Store or update a single fact/memory by key. Use this when the user says "remember this" or you need to persist a fact across sessions. Creates a new entry if the key is new, or updates the existing one. Returns whether the entry was created or updated, and the previous content if it was an update (so you can detect what changed).',
  mcpTool: "memory_upsert",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--key <key>", "Unique identifier for this memory")
      .requiredOption("--content <md>", "The fact or memory to store")
      .option("--source <s>", "Origin (e.g. user-stated, inferred)")
      .option("--confidence <n>", "Confidence 0.0–1.0", (v) => parseFloat(v))
      .option("--tags <csv>", "Comma-separated tags")
      .option("--workspace-id <id>", "Workspace ID"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const tags = input.tags
      ? input.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : undefined;
    const client = createClient(config.baseUrl, config.apiKey);
    return client.memoryUpsert({
      key: input.key,
      content: input.content,
      workspaceId,
      source: input.source,
      confidence: input.confidence,
      tags,
    });
  },
};
