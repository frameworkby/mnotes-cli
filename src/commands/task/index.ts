import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { listTasksAction } from "./list";
import { toggleTaskAction } from "./toggle";

export function registerTaskGroup(program: Command): void {
  registerGroup(program, "task", [listTasksAction, toggleTaskAction]);
}
