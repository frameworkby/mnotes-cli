import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { suggestTagsAction } from "./suggest-tags";
import { suggestTagsLinksAction } from "./suggest-tags-links";
import { setImportanceAction } from "./set-importance";
import { setProvenanceAction } from "./set-provenance";
import { getProvenanceAction } from "./get-provenance";
import { splitNoteAction } from "./split";
import { synthesizeAction } from "./synthesize";

export function registerNoteExtGroup(program: Command): void {
  registerGroup(program, "note-ext", [
    suggestTagsAction,
    suggestTagsLinksAction,
    setImportanceAction,
    setProvenanceAction,
    getProvenanceAction,
    splitNoteAction,
    synthesizeAction,
  ]);
}
