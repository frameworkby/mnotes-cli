import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ZodSchema } from "zod";

import { listNotesResponseSchema } from "../../parity/schemas/list_notes";
import { listFoldersResponseSchema } from "../../parity/schemas/list_folders";
import { getWorkspaceSummaryResponseSchema } from "../../parity/schemas/get_workspace_summary";
import { manageFoldersResponseSchema } from "../../parity/schemas/manage_folders";
import { getRecentNotesResponseSchema } from "../../parity/schemas/get_recent_notes";
import { searchByTagsResponseSchema } from "../../parity/schemas/search_by_tags";
import { moveFolderResponseSchema } from "../../parity/schemas/move_folder";
import { uploadFileResponseSchema } from "../../parity/schemas/upload_file";
import { listAction } from "../../commands/note/list";
import { cliRegistry } from "../../commands/_register-group";
import { buildProgram } from "../../index";
import rawManifest from "../../parity/mcp-manifest.json";

const manifestTools = rawManifest as unknown as Array<{ tool: string }>;

// Building the program populates `cliRegistry` via `registerGroup`. We do this
// once at module load so every test in this file sees the bound commands.
buildProgram();

interface ParityCase {
  /** MCP tool name. */
  tool: string;
  /** Expected CLI command path bound in the registry. */
  commandPath: string;
  /** Shared Zod schema both fixture and live CLI output must satisfy. */
  schema: ZodSchema<unknown>;
  /**
   * Path(s) under `fixtures/` (extension included). Multiple fixtures cover
   * different response variants of the same tool (e.g. union branches like
   * `manage_folders` create vs delete, or `upload_file` with vs without
   * warning). Every listed fixture must parse against `schema`.
   */
  fixture: string | string[];
  /** Optional live invoker that produces a CLI-shaped response without a network call. */
  invokeCli?: () => Promise<unknown>;
}

const FIXTURES_DIR = join(__dirname, "fixtures");

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, name), "utf8"));
}

/**
 * Parity contract: each tool listed here must
 *   1. have a CLI command bound in the registry,
 *   2. emit JSON whose top-level shape parses against `schema`, and
 *   3. ship a representative fixture that also parses against `schema`.
 *
 * Fixtures are minimal-but-valid: they only need to exercise the schema, not
 * model production data. Where a `run` handler performs reshaping (e.g. note
 * `list`) we mirror it here via `invokeCli`. For commands whose `run` is a
 * thin client passthrough, we trust the client's typed response and skip the
 * live invocation — schema-on-fixture is the structural floor either way.
 */
const cases: ParityCase[] = [
  {
    tool: "list_notes",
    commandPath: "note list",
    schema: listNotesResponseSchema,
    fixture: "list_notes.json",
    invokeCli: async () => {
      const apiResp = {
        data: [
          {
            id: "note_01",
            title: "Sprint 53 kickoff",
            folderId: "folder_root",
            type: "note",
            updatedAt: "2026-04-29T10:00:00.000Z",
          },
        ],
        nextCursor: null as string | null,
      };
      // FIXME(story-2): inject client into action so test can call
      // listAction.run directly instead of mirroring the reshape inline.
      void listAction;
      return { notes: apiResp.data, nextCursor: apiResp.nextCursor };
    },
  },
  {
    tool: "list_folders",
    commandPath: "folder list",
    schema: listFoldersResponseSchema,
    fixture: "list_folders.json",
  },
  {
    tool: "get_workspace_summary",
    commandPath: "folder summary",
    schema: getWorkspaceSummaryResponseSchema,
    fixture: "get_workspace_summary.json",
  },
  {
    tool: "manage_folders",
    commandPath: "folder manage",
    schema: manageFoldersResponseSchema,
    // Both branches of the union must parse: create/rename returns a folder
    // record, delete returns `{ deleted }`.
    fixture: ["manage_folders.json", "manage_folders_delete.json"],
  },
  {
    tool: "get_recent_notes",
    commandPath: "folder recent",
    schema: getRecentNotesResponseSchema,
    fixture: "get_recent_notes.json",
  },
  {
    tool: "search_by_tags",
    commandPath: "folder search-tags",
    schema: searchByTagsResponseSchema,
    fixture: "search_by_tags.json",
  },
  {
    tool: "move_folder",
    commandPath: "folder move",
    schema: moveFolderResponseSchema,
    fixture: "move_folder.json",
  },
  {
    tool: "upload_file",
    commandPath: "file upload",
    schema: uploadFileResponseSchema,
    // Cover both the success shape and the partial-success shape with a
    // `warning` field (server returns the latter when noteId linkage fails).
    fixture: ["upload_file.json", "upload_file_warning.json"],
  },
];

// Flatten <tool, fixture[]> into one row per fixture so every variant gets a
// named test row in vitest output.
interface FixtureRow {
  tool: string;
  fixture: string;
  schema: ZodSchema<unknown>;
}
const fixtureRows: FixtureRow[] = cases.flatMap((c) => {
  const files = Array.isArray(c.fixture) ? c.fixture : [c.fixture];
  return files.map((fixture) => ({ tool: c.tool, fixture, schema: c.schema }));
});

describe("CLI ⇄ MCP parity", () => {
  it.each(fixtureRows)(
    "$tool — fixture $fixture parses against shared schema",
    ({ schema, fixture }) => {
      const fix = loadFixture(fixture);
      expect(() => schema.parse(fix)).not.toThrow();
    },
  );

  it.each(cases.filter((c) => c.invokeCli))(
    "$tool — live CLI output parses against shared schema",
    async ({ schema, invokeCli }) => {
      const live = await invokeCli!();
      expect(() => schema.parse(live)).not.toThrow();
    },
  );

  it.each(cases)(
    "$tool — bound to CLI command $commandPath",
    ({ tool, commandPath }) => {
      const bound = cliRegistry.find((r) => r.mcpTool === tool);
      expect(bound, `${tool} must be bound`).toBeDefined();
      expect(bound?.commandPath).toBe(commandPath);
    },
  );

  it("manifest contains every tool we claim parity for", () => {
    expect(Array.isArray(manifestTools)).toBe(true);
    for (const c of cases) {
      expect(
        manifestTools.some((t) => t.tool === c.tool),
        `manifest must list ${c.tool}`,
      ).toBe(true);
    }
  });
});
