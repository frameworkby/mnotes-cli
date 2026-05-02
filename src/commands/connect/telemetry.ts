/**
 * Re-export for backward compatibility. The connect command still calls
 * sendTelemetry({ event, target }) — delegate to the shared helper.
 */
import { sendTelemetryEvent } from "../../lib/telemetry";

export async function sendTelemetry(opts: {
  event: string;
  target: "claude" | "cursor";
}): Promise<void> {
  return sendTelemetryEvent(opts);
}
