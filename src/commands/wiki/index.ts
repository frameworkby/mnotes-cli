import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { lintAction } from "./lint";

export function registerWikiGroup(program: Command): void {
  registerGroup(program, "wiki", [lintAction]);
}
