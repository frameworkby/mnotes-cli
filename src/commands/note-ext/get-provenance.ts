import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { GetProvenanceResult } from "../../client";

interface Input {
  id: string;
}

export const getProvenanceAction: ActionDescriptor<Input, GetProvenanceResult> = {
  name: "get-provenance",
  describe:
    "Retrieve the provenance chain for a note — the list of sources where its knowledge originated.",
  mcpTool: "get_provenance",
  positional: ["id"],
  args: (cmd: Command) =>
    cmd
      .argument("<id>", "Note ID"),
  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getProvenance(input.id, workspaceId);
  },
};
