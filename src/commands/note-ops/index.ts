import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { appendAction } from "./append";
import { archiveAction } from "./archive";
import { pinAction } from "./pin";
import { unpinAction } from "./unpin";
import { starAction } from "./star";
import { frontmatterGetAction } from "./frontmatter-get";
import { frontmatterSetAction } from "./frontmatter-set";
import { setTypeAction } from "./set-type";
import { versionsAction } from "./versions";
import { restoreVersionAction } from "./restore-version";
import { byTitleAction } from "./by-title";
import { batchAction } from "./batch";
import { pinnedAction } from "./pinned";
import { starredAction } from "./starred";
import { staleAction } from "./stale";
import { orphanAction } from "./orphan";
import { duplicatesAction } from "./duplicates";
import { dailyAction } from "./daily";
import { dailyDigestAction } from "./daily-digest";
import { noteSummaryAction } from "./note-summary";

export function registerNoteOpsGroup(program: Command): void {
  registerGroup(program, "note-ops", [
    appendAction,
    archiveAction,
    pinAction,
    unpinAction,
    starAction,
    frontmatterGetAction,
    frontmatterSetAction,
    setTypeAction,
    versionsAction,
    restoreVersionAction,
    byTitleAction,
    batchAction,
    pinnedAction,
    starredAction,
    staleAction,
    orphanAction,
    duplicatesAction,
    dailyAction,
    dailyDigestAction,
    noteSummaryAction,
  ]);
}
