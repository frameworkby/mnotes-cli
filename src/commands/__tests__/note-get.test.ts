import { describe, it, expect, vi, beforeEach } from "vitest";
import { getNoteAction } from "../note/get";
import type { ActionContext } from "../_register-group";
import * as telemetryModule from "../../lib/telemetry";

// ── shared mocks ─────────────────────────────────────────────────────────────

vi.mock("../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.example.com",
    workspaceId: undefined,
  })),
}));

vi.mock("../../client", () => ({
  createClient: vi.fn(() => ({
    getNote: vi.fn(),
  })),
}));

import * as clientModule from "../../client";

const sendTelemetrySpy = vi
  .spyOn(telemetryModule, "sendTelemetryEvent")
  .mockResolvedValue(undefined);

// ── helpers ───────────────────────────────────────────────────────────────────

const ctx: ActionContext = { json: false, globalOpts: {} };

function makeNote(overrides: Partial<{
  id: string;
  title: string;
  content: string | null;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  return {
    id: "note-1",
    title: "Some Note",
    content: "body",
    folderId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function mockGetNote(note: ReturnType<typeof makeNote>) {
  const client = { getNote: vi.fn().mockResolvedValue({ data: note }) };
  vi.mocked(clientModule.createClient).mockReturnValue(client as never);
  return client;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("getNoteAction (mcpTool: get_note) — digest telemetry", () => {
  beforeEach(() => {
    sendTelemetrySpy.mockClear();
    telemetryModule._resetDigestCounter();
  });

  it("fires digest telemetry with source 'mcp' when note matches digest pattern", async () => {
    const createdAt = new Date(Date.now() - 10 * 3_600_000).toISOString(); // 10 hours ago
    mockGetNote(makeNote({ title: "Daily Digest — 2026-05-01", createdAt }));

    await getNoteAction.run({ id: "note-1" }, ctx);

    expect(sendTelemetrySpy).toHaveBeenCalledOnce();
    const call = sendTelemetrySpy.mock.calls[0]![0];
    expect(call).toMatchObject({
      event: "digest_note_opened",
      props: {
        source: "mcp",
        age_hours: "6-24",
        session_index: 1,
      },
    });
  });

  it("does NOT fire digest telemetry for a non-digest note", async () => {
    mockGetNote(makeNote({ title: "Project Planning" }));

    await getNoteAction.run({ id: "note-1" }, ctx);

    expect(sendTelemetrySpy).not.toHaveBeenCalled();
  });

  it("returns the note data regardless of digest status", async () => {
    const note = makeNote({ title: "Daily Digest — 2026-05-01" });
    mockGetNote(note);

    const result = await getNoteAction.run({ id: "note-1" }, ctx);

    expect(result).toEqual(note);
  });

  it("increments session_index across multiple calls in the same process", async () => {
    const createdAt = new Date().toISOString();

    for (let i = 1; i <= 3; i++) {
      mockGetNote(makeNote({ title: "Daily Digest — 2026-05-01", createdAt }));
      await getNoteAction.run({ id: "note-1" }, ctx);
    }

    expect(sendTelemetrySpy).toHaveBeenCalledTimes(3);
    const indices = sendTelemetrySpy.mock.calls.map(
      ([opts]) => (opts as { props: { session_index: number } }).props.session_index,
    );
    expect(indices).toEqual([1, 2, 3]);
  });

  it("caps session_index at 3 for subsequent calls", async () => {
    const createdAt = new Date().toISOString();

    for (let i = 0; i < 5; i++) {
      mockGetNote(makeNote({ title: "Daily Digest — 2026-05-01", createdAt }));
      await getNoteAction.run({ id: "note-1" }, ctx);
    }

    const indices = sendTelemetrySpy.mock.calls.map(
      ([opts]) => (opts as { props: { session_index: number } }).props.session_index,
    );
    expect(indices).toEqual([1, 2, 3, 3, 3]);
  });
});
