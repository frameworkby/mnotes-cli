import { describe, it, expect, vi, beforeEach } from "vitest";
import { askAction } from "../kb/ask";
import type { ActionContext } from "../_register-group";

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: "ws-1",
  })),
}));

const mockAskNotes = vi.fn();

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({ askNotes: mockAskNotes })),
}));

const ctx: ActionContext = { json: true, globalOpts: {} };

beforeEach(() => {
  vi.clearAllMocks();
  mockAskNotes.mockResolvedValue({ answer: null, contextOnly: true, context: "ctx", confidence: 0, sources: [] });
});

describe("askAction.run", () => {
  it("passes contextOnly: true with --context-only and returns the payload unchanged", async () => {
    const result = await askAction.run({ question: "q", contextOnly: true }, ctx);
    expect(mockAskNotes).toHaveBeenCalledWith({ question: "q", workspaceId: "ws-1", limit: undefined, contextOnly: true });
    expect(result.context).toBe("ctx");
  });

  it("omits contextOnly when the flag is not given", async () => {
    await askAction.run({ question: "q" }, ctx);
    expect(mockAskNotes.mock.calls[0][0]).not.toHaveProperty("contextOnly");
  });
});
