import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import { readConfig } from "../login";
import type { ActionDescriptor } from "../_register-group";

interface ListOutput {
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    isDefault: boolean;
  }>;
}

export const listWorkspacesAction: ActionDescriptor<Record<string, never>, ListOutput> = {
  name: "list",
  describe: "List all workspaces",
  mcpTool: "list_workspaces",

  run: async (_input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);
    const res = await client.listWorkspaces();
    return { workspaces: res.data };
  },

  renderHuman: (output) => {
    const stored = readConfig();
    const cwd = process.cwd();
    const dirMapped = stored?.workspaces?.[cwd];
    const globalDefault = stored?.workspaceId;

    if (output.workspaces.length === 0) {
      console.log(
        "No workspaces found. Create one with: mnotes workspace create --name <name>",
      );
      return;
    }

    for (const w of output.workspaces) {
      const markers: string[] = [];
      if (w.isDefault) markers.push("default");
      if (w.id === dirMapped) markers.push("linked");
      else if (w.id === globalDefault) markers.push("global");
      const suffix = markers.length > 0 ? `  (${markers.join(", ")})` : "";
      console.log(`  ${w.name} [${w.slug}]${suffix}`);
    }
  },
};
