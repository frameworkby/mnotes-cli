import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { SetProvenanceResult } from "../../client";

const SOURCE_VALUES = ["url", "mcp_tool", "conversation", "manual"] as const;
type SourceValue = (typeof SOURCE_VALUES)[number];

interface Input {
  id: string;
  source: SourceValue;
  ref: string;
  workspaceId?: string;
}

export const setProvenanceAction: ActionDescriptor<Input, SetProvenanceResult> = {
  name: "set-provenance",
  describe:
    "Append a provenance entry to a note, recording where the knowledge originated. Each entry has a source type (url, mcp_tool, conversation, manual) and a reference string.",
  mcpTool: "set_provenance",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID")
      .requiredOption(
        "--source <type>",
        `Source type (${SOURCE_VALUES.join("|")})`,
      )
      .requiredOption("--ref <text>", "Reference string (e.g. URL, tool name)")
      .option("--workspace-id <id>", "Workspace ID"),
  run: async (input, ctx) => {
    if (!SOURCE_VALUES.includes(input.source)) {
      throw new Error(
        `--source must be one of: ${SOURCE_VALUES.join(", ")}`,
      );
    }
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = input.workspaceId ?? config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "workspaceId is required (use --workspace-id or set MNOTES_WORKSPACE_ID)",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.setProvenance(input.id, {
      source: input.source,
      ref: input.ref,
      workspaceId,
    });
  },
};
