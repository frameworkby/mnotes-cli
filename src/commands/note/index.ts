import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { listAction } from "./list";
import { createNoteAction } from "./create";
import { getNoteAction } from "./get";
import { updateNoteAction } from "./update";
import { deleteNoteAction } from "./delete";
import { searchNotesAction } from "./search";

export function registerNoteGroup(program: Command): void {
  registerGroup(program, "note", [
    listAction,
    createNoteAction,
    getNoteAction,
    updateNoteAction,
    deleteNoteAction,
    searchNotesAction,
  ]);
}
