import { resolveConfig } from "../../config";
import { createClient, BOARD_STATUSES, BOARD_PRIORITIES } from "../../client";
import type { BoardStatus, BoardPriority, BoardTask } from "../../client";

export const STATUS_LABELS: Record<BoardStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
};

/** Accepts the API strings plus `in-progress` as an alias of `in_progress`. */
export function parseStatus(value: string): BoardStatus {
  const s = value.trim().toLowerCase().replace(/-/g, "_");
  if (!(BOARD_STATUSES as readonly string[]).includes(s)) {
    throw new Error(`Invalid status '${value}'. Use one of: ${BOARD_STATUSES.join(", ")}`);
  }
  return s as BoardStatus;
}

export function parsePriority(value: string): BoardPriority {
  if (!(BOARD_PRIORITIES as readonly string[]).includes(value)) {
    throw new Error(`Invalid priority '${value}'. Use one of: ${BOARD_PRIORITIES.join(", ")}`);
  }
  return value as BoardPriority;
}

/** Commander collector for repeatable flags like `--note-id a --note-id b`. */
export function collect(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}

export function boardClient(globalOpts: Record<string, unknown>) {
  const config = resolveConfig(globalOpts);
  return { client: createClient(config.baseUrl, config.apiKey), workspaceId: config.workspaceId };
}

export function formatTask(t: BoardTask): string {
  const meta = [t.priority !== "none" ? t.priority : null, t.assignee ? `@${t.assignee}` : null]
    .filter(Boolean)
    .join(", ");
  return `${t.id}  [${STATUS_LABELS[t.status] ?? t.status}] ${t.title}${meta ? `  (${meta})` : ""}`;
}
