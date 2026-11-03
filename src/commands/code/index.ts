import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { codeStatusAction } from "./status";
import { codeSearchAction } from "./search";
import { codeShowAction } from "./show";
import { codeImpactAction } from "./impact";
import { codeRefreshAction } from "./refresh";

/** `mnotes code …`: query the repo's code graph build (graphify import). */
export function registerCodeGroup(program: Command): void {
  registerGroup(program, "code", [
    codeStatusAction,
    codeSearchAction,
    codeShowAction,
    codeImpactAction,
    codeRefreshAction,
  ]);
}
