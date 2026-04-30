import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { contextFetchAction } from "./context-fetch";
import { projectLoadAction } from "./project-load";

export function registerCompositeGroup(program: Command): void {
  registerGroup(program, "composite", [contextFetchAction, projectLoadAction]);
}
