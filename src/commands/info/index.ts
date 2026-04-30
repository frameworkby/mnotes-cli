import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { versionAction } from "./version";
import { instructionsAction } from "./instructions";

export function registerInfoGroup(program: Command): void {
  registerGroup(program, "info", [versionAction, instructionsAction]);
}
