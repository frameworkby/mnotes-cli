import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { listSmartFoldersAction } from "./list";
import { createSmartFolderAction } from "./create";
import { deleteSmartFolderAction } from "./delete";

export function registerSmartFolderGroup(program: Command): void {
  registerGroup(program, "smart-folder", [
    listSmartFoldersAction,
    createSmartFolderAction,
    deleteSmartFolderAction,
  ]);
}
