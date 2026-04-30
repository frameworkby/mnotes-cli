"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNoteOpsGroup = registerNoteOpsGroup;
const _register_group_1 = require("../_register-group");
const append_1 = require("./append");
const archive_1 = require("./archive");
const pin_1 = require("./pin");
const unpin_1 = require("./unpin");
const star_1 = require("./star");
const frontmatter_get_1 = require("./frontmatter-get");
const frontmatter_set_1 = require("./frontmatter-set");
const set_type_1 = require("./set-type");
const versions_1 = require("./versions");
const restore_version_1 = require("./restore-version");
const by_title_1 = require("./by-title");
const batch_1 = require("./batch");
const pinned_1 = require("./pinned");
const starred_1 = require("./starred");
const stale_1 = require("./stale");
const orphan_1 = require("./orphan");
const duplicates_1 = require("./duplicates");
const daily_1 = require("./daily");
const daily_digest_1 = require("./daily-digest");
const note_summary_1 = require("./note-summary");
function registerNoteOpsGroup(program) {
    (0, _register_group_1.registerGroup)(program, "note-ops", [
        append_1.appendAction,
        archive_1.archiveAction,
        pin_1.pinAction,
        unpin_1.unpinAction,
        star_1.starAction,
        frontmatter_get_1.frontmatterGetAction,
        frontmatter_set_1.frontmatterSetAction,
        set_type_1.setTypeAction,
        versions_1.versionsAction,
        restore_version_1.restoreVersionAction,
        by_title_1.byTitleAction,
        batch_1.batchAction,
        pinned_1.pinnedAction,
        starred_1.starredAction,
        stale_1.staleAction,
        orphan_1.orphanAction,
        duplicates_1.duplicatesAction,
        daily_1.dailyAction,
        daily_digest_1.dailyDigestAction,
        note_summary_1.noteSummaryAction,
    ]);
}
