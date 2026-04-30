import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { listRecipesAction } from "./list";
import { runRecipeAction } from "./run";

export function registerRecipeGroup(program: Command): void {
  registerGroup(program, "recipe", [listRecipesAction, runRecipeAction]);
}
