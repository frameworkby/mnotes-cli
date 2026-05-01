import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendTelemetry } from "../telemetry";

import * as configModule from "../../../config";

// Mock resolveConfig so tests don't need a real ~/.mnotes/config.json
vi.mock("../../../config", () => ({
  resolveConfig: vi.fn(() => ({
    apiKey: "test-key",
    baseUrl: "https://mnotes.framework.by",
    workspaceId: undefined,
  })),
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("sendTelemetry", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.mocked(configModule.resolveConfig).mockReturnValue({
      apiKey: "test-key",
      baseUrl: "https://mnotes.framework.by",
      workspaceId: undefined,
    });
  });

  it("POSTs to /api/telemetry/event with correct shape on success", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ accepted: true }), { status: 202 }));

    await sendTelemetry({ event: "cli_connect_success", target: "claude" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit & { body: string }];
    expect(url).toBe("https://mnotes.framework.by/api/telemetry/event");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");

    const body = JSON.parse(init.body) as {
      event: string;
      target: string;
      version: string;
    };
    expect(body.event).toBe("cli_connect_success");
    expect(body.target).toBe("claude");
    expect(typeof body.version).toBe("string");
    expect(body.version.length).toBeGreaterThan(0);
  });

  it("swallows error silently when fetch rejects (network failure)", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    // Must resolve without throwing
    await expect(sendTelemetry({ event: "cli_connect_success", target: "cursor" })).resolves.toBeUndefined();
  });

  it("swallows error silently when fetch times out (AbortError)", async () => {
    fetchMock.mockRejectedValueOnce(
      Object.assign(new Error("The operation was aborted"), { name: "AbortError" }),
    );

    await expect(sendTelemetry({ event: "cli_connect_success", target: "claude" })).resolves.toBeUndefined();
  });

  it("swallows error silently when server returns non-2xx", async () => {
    fetchMock.mockResolvedValueOnce(new Response("Bad Request", { status: 400 }));

    // Non-2xx is not thrown by fetch — it just returns a Response. sendTelemetry
    // doesn't inspect the status, so this must also resolve cleanly.
    await expect(sendTelemetry({ event: "cli_connect_success", target: "cursor" })).resolves.toBeUndefined();
  });

  it("strips trailing slash and /api/mcp suffix from base URL", async () => {
    vi.mocked(configModule.resolveConfig).mockReturnValueOnce({
      apiKey: "key",
      baseUrl: "https://example.com/api/mcp",
      workspaceId: undefined,
    });

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 202 }));
    await sendTelemetry({ event: "cli_connect_success", target: "claude" });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("https://example.com/api/telemetry/event");
  });
});
