import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { WikiLogAppendResult } from "../../client";

type LogKind = "ingest" | "query" | "lint" | "decision";

const VALID_KINDS: readonly LogKind[] = ["ingest", "query", "lint", "decision"];

interface LogAppendInput {
  kind: string;
  ref: string;
  summary?: string;
  json?: boolean;
}

function renderHuman(out: WikiLogAppendResult): void {
  process.stdout.write(`${out.appended}\n`);
}

export const logAppendAction: ActionDescriptor<LogAppendInput, WikiLogAppendResult> = {
  name: "append",
  describe:
    "Append an entry to the wiki activity log. Kind must be one of: ingest, query, lint, decision.",
  args: (cmd: Command) =>
    cmd
      .requiredOption("--kind <kind>", "Entry kind: ingest, query, lint, decision")
      .requiredOption("--ref <text>", "Reference identifier for the log entry")
      .option("--summary <text>", "Optional human-readable summary")
      .option("--json", "Emit full JSON envelope"),

  run: async (input, ctx) => {
    if (!(VALID_KINDS as readonly string[]).includes(input.kind)) {
      process.stderr.write(
        `Error: Invalid kind '${input.kind}'. Valid values: ${VALID_KINDS.join(", ")}\n`,
      );
      process.exit(1);
    }

    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.wikiLogAppend({
      workspaceId,
      kind: input.kind as LogKind,
      ref: input.ref,
      summary: input.summary,
    });
  },

  renderHuman,
};
