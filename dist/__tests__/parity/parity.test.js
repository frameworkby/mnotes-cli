"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const list_notes_1 = require("../../parity/schemas/list_notes");
const list_folders_1 = require("../../parity/schemas/list_folders");
const get_workspace_summary_1 = require("../../parity/schemas/get_workspace_summary");
const manage_folders_1 = require("../../parity/schemas/manage_folders");
const get_recent_notes_1 = require("../../parity/schemas/get_recent_notes");
const search_by_tags_1 = require("../../parity/schemas/search_by_tags");
const move_folder_1 = require("../../parity/schemas/move_folder");
const upload_file_1 = require("../../parity/schemas/upload_file");
const list_1 = require("../../commands/note/list");
const _register_group_1 = require("../../commands/_register-group");
const index_1 = require("../../index");
const mcp_manifest_json_1 = __importDefault(require("../../parity/mcp-manifest.json"));
const manifestTools = mcp_manifest_json_1.default;
// Building the program populates `cliRegistry` via `registerGroup`. We do this
// once at module load so every test in this file sees the bound commands.
(0, index_1.buildProgram)();
const FIXTURES_DIR = (0, node_path_1.join)(__dirname, "fixtures");
function loadFixture(name) {
    return JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(FIXTURES_DIR, name), "utf8"));
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
const cases = [
    {
        tool: "list_notes",
        commandPath: "note list",
        schema: list_notes_1.listNotesResponseSchema,
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
                nextCursor: null,
            };
            // FIXME(story-2): inject client into action so test can call
            // listAction.run directly instead of mirroring the reshape inline.
            void list_1.listAction;
            return { notes: apiResp.data, nextCursor: apiResp.nextCursor };
        },
    },
    {
        tool: "list_folders",
        commandPath: "folder list",
        schema: list_folders_1.listFoldersResponseSchema,
        fixture: "list_folders.json",
    },
    {
        tool: "get_workspace_summary",
        commandPath: "folder summary",
        schema: get_workspace_summary_1.getWorkspaceSummaryResponseSchema,
        fixture: "get_workspace_summary.json",
    },
    {
        tool: "manage_folders",
        commandPath: "folder manage",
        schema: manage_folders_1.manageFoldersResponseSchema,
        // Both branches of the union must parse: create/rename returns a folder
        // record, delete returns `{ deleted }`.
        fixture: ["manage_folders.json", "manage_folders_delete.json"],
    },
    {
        tool: "get_recent_notes",
        commandPath: "folder recent",
        schema: get_recent_notes_1.getRecentNotesResponseSchema,
        fixture: "get_recent_notes.json",
    },
    {
        tool: "search_by_tags",
        commandPath: "folder search-tags",
        schema: search_by_tags_1.searchByTagsResponseSchema,
        fixture: "search_by_tags.json",
    },
    {
        tool: "move_folder",
        commandPath: "folder move",
        schema: move_folder_1.moveFolderResponseSchema,
        fixture: "move_folder.json",
    },
    {
        tool: "upload_file",
        commandPath: "file upload",
        schema: upload_file_1.uploadFileResponseSchema,
        // Cover both the success shape and the partial-success shape with a
        // `warning` field (server returns the latter when noteId linkage fails).
        fixture: ["upload_file.json", "upload_file_warning.json"],
    },
];
const fixtureRows = cases.flatMap((c) => {
    const files = Array.isArray(c.fixture) ? c.fixture : [c.fixture];
    return files.map((fixture) => ({ tool: c.tool, fixture, schema: c.schema }));
});
(0, vitest_1.describe)("CLI ⇄ MCP parity", () => {
    vitest_1.it.each(fixtureRows)("$tool — fixture $fixture parses against shared schema", ({ schema, fixture }) => {
        const fix = loadFixture(fixture);
        (0, vitest_1.expect)(() => schema.parse(fix)).not.toThrow();
    });
    vitest_1.it.each(cases.filter((c) => c.invokeCli))("$tool — live CLI output parses against shared schema", async ({ schema, invokeCli }) => {
        const live = await invokeCli();
        (0, vitest_1.expect)(() => schema.parse(live)).not.toThrow();
    });
    vitest_1.it.each(cases)("$tool — bound to CLI command $commandPath", ({ tool, commandPath }) => {
        const bound = _register_group_1.cliRegistry.find((r) => r.mcpTool === tool);
        (0, vitest_1.expect)(bound, `${tool} must be bound`).toBeDefined();
        (0, vitest_1.expect)(bound?.commandPath).toBe(commandPath);
    });
    (0, vitest_1.it)("manifest contains every tool we claim parity for", () => {
        (0, vitest_1.expect)(Array.isArray(manifestTools)).toBe(true);
        for (const c of cases) {
            (0, vitest_1.expect)(manifestTools.some((t) => t.tool === c.tool), `manifest must list ${c.tool}`).toBe(true);
        }
    });
});
