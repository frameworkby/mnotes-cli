import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { contextAction } from "./context";
import { roleAction } from "./role";
import { updateWsAction } from "./update";
import { deleteWsAction } from "./delete";
import { setupWsAction } from "./setup";
import { teamAction } from "./team";

export function registerWsGroup(program: Command): void {
  registerGroup(program, "ws", [
    contextAction,
    roleAction,
    updateWsAction,
    deleteWsAction,
    setupWsAction,
    teamAction,
  ]);
}
