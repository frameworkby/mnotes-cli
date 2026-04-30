import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { listObjectTypesAction } from "./list";
import { queryByTypeAction } from "./query";

export function registerObjectTypeGroup(program: Command): void {
  registerGroup(program, "object-type", [
    listObjectTypesAction,
    queryByTypeAction,
  ]);
}
