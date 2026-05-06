/**
 * AC for #894: when no workspace is resolvable from any source, commands that
 * require a workspace ID must throw with the friendly message instead of a
 * cryptic internal error.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { appendAction } from "../note-ops/append";
import type { ActionContext } from "../_register-group";

// Mock resolveConfig to return no workspaceId
vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: undefined,
  })),
}));

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({
    appendToNote: vi.fn(),
  })),
}));

const ctx: ActionContext = { json: false, globalOpts: {} };

describe("workspace resolution — no workspace configured", () => {
  let origWorkspaceId: string | undefined;

  beforeEach(() => {
    origWorkspaceId = process.env.MNOTES_WORKSPACE_ID;
    delete process.env.MNOTES_WORKSPACE_ID;
  });

  afterEach(() => {
    if (origWorkspaceId !== undefined) {
      process.env.MNOTES_WORKSPACE_ID = origWorkspaceId;
    } else {
      delete process.env.MNOTES_WORKSPACE_ID;
    }
  });

  it("throws the friendly error message when no workspace is resolvable", async () => {
    await expect(
      appendAction.run({ id: "note-1", content: "some content" }, ctx)
    ).rejects.toThrow(
      "No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID."
    );
  });

  it("error message does not reference --workspace-id flag (removed in v2)", async () => {
    let message = "";
    try {
      await appendAction.run({ id: "note-1", content: "some content" }, ctx);
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    expect(message).not.toContain("--workspace-id");
  });
});
