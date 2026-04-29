import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { listFoldersAction } from "./list";
import { folderSummaryAction } from "./summary";
import { manageFoldersAction } from "./manage";
import { folderRecentAction } from "./recent";
import { folderSearchTagsAction } from "./search-tags";
import { moveFolderAction } from "./move";

export function registerFolderGroup(program: Command): void {
  registerGroup(program, "folder", [
    listFoldersAction,
    folderSummaryAction,
    manageFoldersAction,
    folderRecentAction,
    folderSearchTagsAction,
    moveFolderAction,
  ]);
}
