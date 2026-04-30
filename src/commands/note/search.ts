import type { Command } from "commander";
import { resolveConfig } from "../../config";
import { createClient } from "../../client";
import { printSearchResults } from "../../output";
import type { ActionDescriptor } from "../_register-group";
import type { SearchResult } from "../../client";

interface SearchInput {
  query: string;
  workspace?: string;
  limit?: number;
  semantic?: boolean;
}

interface SearchOutput {
  results: SearchResult[];
}

export const searchNotesAction: ActionDescriptor<SearchInput, SearchOutput> = {
  name: "search",
  describe: "Search notes (full-text or semantic)",
  mcpTool: "search_notes",
  positional: ["query"],
  args: (cmd: Command) =>
    cmd
      .argument("<query>", "Search query")
      .option("--workspace <id>", "Workspace ID")
      .option("--limit <n>", "Max results to display", (v: string) => parseInt(v, 10))
      .option("--semantic", "Use semantic (vector) search instead of full-text"),

  run: async (input, ctx) => {
    const config = resolveConfig(ctx.globalOpts);
    const client = createClient(config.baseUrl, config.apiKey);

    const res = await client.searchNotes({
      query: input.query,
      mode: input.semantic ? "semantic" : "fulltext",
      workspaceId: input.workspace ?? config.workspaceId,
    });

    let results = res.data.results;
    if (input.limit !== undefined && input.limit > 0) {
      results = results.slice(0, input.limit);
    }
    return { results };
  },

  renderHuman: (output) => {
    printSearchResults(output.results);
  },
};
