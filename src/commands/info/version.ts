import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";

export const versionAction: ActionDescriptor<Record<string, unknown>, unknown> = {
  name: "version",
  describe: "Show the m-notes server version (no auth required for the route, but client uses configured key).",
  args: (cmd: Command) => cmd,
  run: async (_input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);
    return client.getVersion();
  },
};
