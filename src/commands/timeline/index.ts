import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { listTimelineAction } from "./list";

export function registerTimelineGroup(program: Command): void {
  registerGroup(program, "timeline", [listTimelineAction]);
}
