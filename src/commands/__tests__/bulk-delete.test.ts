import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import { bulkDeleteAction } from "../bulk/delete";
import type { ActionContext } from "../_register-group";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: "ws-1",
  })),
}));

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({
    deleteNote: vi.fn(),
  })),
}));

vi.mock("fs");

import * as clientModule from "../../client";
import * as configModule from "../../config";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ctx: ActionContext = { json: false, globalOpts: {} };

function mockDeleteNote(impl: (id: string) => Promise<{ data: { id: string } }>) {
  const client = { deleteNote: vi.fn(impl) };
  vi.mocked(clientModule.createClient).mockReturnValue(client as never);
  return client;
}

function mockDeleteNoteSuccess() {
  return mockDeleteNote(async (id) => ({ data: { id } }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("bulkDeleteAction", () => {
  let originalExitCode: number | undefined;

  beforeEach(() => {
    originalExitCode = process.exitCode as number | undefined;
    process.exitCode = undefined;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.exitCode = originalExitCode;
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  it("fails fast when neither --note-ids nor --note-ids-file is provided", async () => {
    await expect(
      bulkDeleteAction.run({ force: true }, ctx),
    ).rejects.toThrow("Provide note IDs via --note-ids");
  });

  it("fails fast when both --note-ids and --note-ids-file are provided", async () => {
    await expect(
      bulkDeleteAction.run(
        { noteIds: "a,b", noteIdsFile: "/tmp/ids.txt", force: true },
        ctx,
      ),
    ).rejects.toThrow("mutually exclusive");
  });

  it("fails fast when --force is absent and --dry-run is absent", async () => {
    await expect(
      bulkDeleteAction.run({ noteIds: "a,b,c" }, ctx),
    ).rejects.toThrow("--force is required");
  });

  it("fails fast when --note-ids is empty string", async () => {
    await expect(
      bulkDeleteAction.run({ noteIds: "  ", force: true }, ctx),
    ).rejects.toThrow("Provide note IDs");
  });

  // ── Dry-run ─────────────────────────────────────────────────────────────────

  it("--dry-run lists targets without calling deleteNote", async () => {
    const client = mockDeleteNoteSuccess();

    const result = await bulkDeleteAction.run(
      { noteIds: "a,b,c", dryRun: true },
      ctx,
    );

    expect(client.deleteNote).not.toHaveBeenCalled();
    expect(result.totalRequested).toBe(3);
    expect(result.deleted).toHaveLength(0);
    expect(result.failed).toHaveLength(0);
    // dryRunTargets attached at runtime
    expect((result as unknown as { dryRunTargets: string[] }).dryRunTargets).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("--dry-run does not require --force", async () => {
    mockDeleteNoteSuccess();
    await expect(
      bulkDeleteAction.run({ noteIds: "a", dryRun: true }, ctx),
    ).resolves.toBeDefined();
  });

  // ── Force delete ────────────────────────────────────────────────────────────

  it("--force deletes all ids and returns deleted list", async () => {
    const client = mockDeleteNoteSuccess();

    const result = await bulkDeleteAction.run(
      { noteIds: "id-1,id-2,id-3", force: true },
      ctx,
    );

    expect(client.deleteNote).toHaveBeenCalledTimes(3);
    expect(client.deleteNote).toHaveBeenCalledWith("id-1");
    expect(client.deleteNote).toHaveBeenCalledWith("id-2");
    expect(client.deleteNote).toHaveBeenCalledWith("id-3");
    expect(result.deleted).toEqual(["id-1", "id-2", "id-3"]);
    expect(result.failed).toHaveLength(0);
    expect(result.totalRequested).toBe(3);
    expect(process.exitCode).toBeUndefined();
  });

  // ── Partial failure ─────────────────────────────────────────────────────────

  it("partial failure: reports failed ids, continues batch, sets exit code 1", async () => {
    const client = mockDeleteNote(async (id) => {
      if (id === "id-2") throw new Error("not found");
      return { data: { id } };
    });

    const result = await bulkDeleteAction.run(
      { noteIds: "id-1,id-2,id-3", force: true },
      ctx,
    );

    // Batch was NOT aborted — all three were attempted
    expect(client.deleteNote).toHaveBeenCalledTimes(3);
    expect(result.deleted).toEqual(["id-1", "id-3"]);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toMatchObject({ id: "id-2", error: "not found" });
    expect(process.exitCode).toBe(1);
  });

  it("all failed: sets exit code 1, deleted is empty", async () => {
    mockDeleteNote(async () => {
      throw new Error("server error");
    });

    const result = await bulkDeleteAction.run(
      { noteIds: "a,b", force: true },
      ctx,
    );

    expect(result.deleted).toHaveLength(0);
    expect(result.failed).toHaveLength(2);
    expect(process.exitCode).toBe(1);
  });

  // ── File input ──────────────────────────────────────────────────────────────

  it("--note-ids-file reads ids one-per-line, strips blanks", async () => {
    const client = mockDeleteNoteSuccess();
    vi.mocked(fs.readFileSync).mockReturnValue("id-1\n  id-2  \n\nid-3\n" as never);

    const result = await bulkDeleteAction.run(
      { noteIdsFile: "/tmp/ids.txt", force: true },
      ctx,
    );

    expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/ids.txt", "utf-8");
    expect(client.deleteNote).toHaveBeenCalledTimes(3);
    expect(result.deleted).toEqual(["id-1", "id-2", "id-3"]);
  });

  it("--note-ids-file with blank-only content throws", async () => {
    vi.mocked(fs.readFileSync).mockReturnValue("\n\n\n" as never);

    await expect(
      bulkDeleteAction.run({ noteIdsFile: "/tmp/ids.txt", force: true }, ctx),
    ).rejects.toThrow("No note IDs found");
  });

  // ── Workspace guard ─────────────────────────────────────────────────────────

  it("throws when workspaceId is not configured", async () => {
    vi.mocked(configModule.resolveConfig).mockReturnValueOnce({
      apiKey: "key",
      baseUrl: "https://mnotes.example.com",
      workspaceId: undefined,
    } as never);

    await expect(
      bulkDeleteAction.run({ noteIds: "a,b", force: true }, ctx),
    ).rejects.toThrow("No workspace configured");
  });

  // ── Registry ────────────────────────────────────────────────────────────────

  it("bulk delete is registered in the bulk group", async () => {
    const { cliRegistry } = await import("../_register-group");
    const { registerBulkGroup } = await import("../bulk/index");
    const { Command } = await import("commander");

    const program = new Command();
    program.allowUnknownOption();
    registerBulkGroup(program);

    const entry = cliRegistry.find(
      (r) => r.group === "bulk" && r.action === "delete",
    );
    expect(entry).toBeDefined();
    expect(entry?.mcpTool).toBe("bulk_delete");
  });
});
