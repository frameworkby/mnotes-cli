import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildProgram } from "../../index";

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
import * as telemetryModule from "../../lib/telemetry";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

// Spy on sendTelemetryEvent so tests can assert calls without real HTTP
const sendTelemetrySpy = vi.spyOn(telemetryModule, "sendTelemetryEvent").mockResolvedValue(undefined);

// ── helpers ───────────────────────────────────────────────────────────────────

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
    content: "body text",
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

describe("mnotes read — digest telemetry", () => {
  beforeEach(() => {
    sendTelemetrySpy.mockClear();
    telemetryModule._resetDigestCounter();
  });

  it("fires digest telemetry with source 'cli' when note title matches digest pattern", async () => {
    const createdAt = new Date(Date.now() - 2 * 3_600_000).toISOString(); // 2 hours ago
    mockGetNote(makeNote({ title: "Daily Digest — 2026-05-01", createdAt }));

    const program = buildProgram();
    await program.parseAsync(["node", "mnotes", "read", "note-1"]);

    expect(sendTelemetrySpy).toHaveBeenCalledOnce();
    const call = sendTelemetrySpy.mock.calls[0]![0];
    expect(call).toMatchObject({
      event: "digest_note_opened",
      props: {
        source: "cli",
        age_hours: "0-6",
        session_index: 1,
      },
    });
  });

  it("does NOT fire digest telemetry for a non-digest note", async () => {
    mockGetNote(makeNote({ title: "Meeting Notes" }));

    const program = buildProgram();
    await program.parseAsync(["node", "mnotes", "read", "note-1"]);

    expect(sendTelemetrySpy).not.toHaveBeenCalled();
  });

  it("buckets age correctly for an old digest note (72+)", async () => {
    const createdAt = new Date(Date.now() - 4 * 24 * 3_600_000).toISOString(); // 4 days ago
    mockGetNote(makeNote({ title: "Daily Digest — 2026-04-27", createdAt }));

    const program = buildProgram();
    await program.parseAsync(["node", "mnotes", "read", "note-1"]);

    expect(sendTelemetrySpy).toHaveBeenCalledOnce();
    const call = sendTelemetrySpy.mock.calls[0]![0] as { props: { age_hours: string } };
    expect(call.props.age_hours).toBe("72+");
  });
});
