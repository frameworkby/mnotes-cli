import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { feedbackAction } from "../kb/feedback";
import { resolveConfig } from "../../config";
import type { ActionContext } from "../_register-group";

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: "ws-1",
  })),
}));

const answerFeedbackMock = vi.fn();

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({ answerFeedback: answerFeedbackMock })),
}));

const ctx: ActionContext = { json: true, globalOpts: {} };
const payload = { data: { answerId: "ans-1", rating: 1, notesUpdated: 3 } };

beforeEach(() => {
  answerFeedbackMock.mockReset();
  answerFeedbackMock.mockResolvedValue(payload);
});

describe("feedbackAction", () => {
  it("sends workspace, answerId, rating and comment; returns the payload unchanged", async () => {
    const out = await feedbackAction.run({ answerId: "ans-1", rating: "up", comment: "good" }, ctx);
    expect(answerFeedbackMock).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      answerId: "ans-1",
      rating: "up",
      comment: "good",
    });
    expect(out).toEqual(payload);
  });

  it("throws without a workspace", async () => {
    vi.mocked(resolveConfig).mockReturnValueOnce({
      apiKey: "k",
      baseUrl: "https://x",
      workspaceId: undefined,
    } as ReturnType<typeof resolveConfig>);
    await expect(feedbackAction.run({ answerId: "a", rating: "up" }, ctx)).rejects.toThrow(/No workspace/);
    expect(answerFeedbackMock).not.toHaveBeenCalled();
  });

  it("rejects a rating outside up/down/clear and requires --rating", () => {
    const cmd = feedbackAction.args!(new Command("feedback")).exitOverride().configureOutput({ writeErr: () => {} });
    expect(() => cmd.parse(["ans-1", "--rating", "maybe"], { from: "user" })).toThrow(/maybe/);
    expect(() => cmd.parse(["ans-1"], { from: "user" })).toThrow(/--rating/);
  });
});
