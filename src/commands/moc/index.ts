import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { generateMocAction } from "./generate";

export function registerMocGroup(program: Command): void {
  registerGroup(program, "moc", [generateMocAction]);
}
