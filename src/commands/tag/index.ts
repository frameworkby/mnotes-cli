import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { listTagsAction } from "./list";
import { manageTagsAction } from "./manage";
import { extractEntitiesAction } from "./extract";

export function registerTagGroup(program: Command): void {
  registerGroup(program, "tag", [
    listTagsAction,
    manageTagsAction,
    extractEntitiesAction,
  ]);
}
