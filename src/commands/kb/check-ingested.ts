import { readFileSync } from "node:fs";
import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import type { ActionDescriptor } from "../_register-group";
import type { CheckIngestedSourcesResult } from "../../client";

interface CheckIngestedInput {
  urls?: string;
  urlsFile?: string;
}

function parseUrlsFile(path: string): string[] {
  const raw = readFileSync(path, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `--urls-file '${path}' must be a JSON array of URL strings`,
    );
  }
  if (!Array.isArray(parsed) || !parsed.every((v) => typeof v === "string")) {
    throw new Error(
      `--urls-file '${path}' must be a JSON array of URL strings`,
    );
  }
  return parsed as string[];
}

export const checkIngestedAction: ActionDescriptor<
  CheckIngestedInput,
  CheckIngestedSourcesResult
> = {
  name: "check-ingested",
  describe:
    "Check which external source URLs have already been ingested into the knowledge base. Returns one row per unique input URL with status 'exists' or 'not_found'.",
  args: (cmd: Command) =>
    cmd
      .option("--urls <csv>", "Comma-separated list of source URLs to check")
      .option(
        "--urls-file <path>",
        "Path to a JSON file containing an array of URL strings",
      ),

  run: async (input, ctx) => {
    if (!input.urls && !input.urlsFile) {
      throw new Error("--urls or --urls-file is required");
    }

    const urls: string[] = [];
    if (input.urls) {
      urls.push(
        ...input.urls
          .split(",")
          .map((u) => u.trim())
          .filter((u) => u.length > 0),
      );
    }
    if (input.urlsFile) {
      urls.push(...parseUrlsFile(input.urlsFile));
    }
    if (urls.length === 0) {
      throw new Error("No URLs provided");
    }

    const config = resolveConfig(ctx.globalOpts);
    const workspaceId = config.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.",
      );
    }
    const client = createClient(config.baseUrl, config.apiKey);
    return client.checkIngestedSources({ workspaceId, sourceUrls: urls });
  },
};
