"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNoteExtGroup = registerNoteExtGroup;
const _register_group_1 = require("../_register-group");
const suggest_tags_1 = require("./suggest-tags");
const suggest_tags_links_1 = require("./suggest-tags-links");
const set_importance_1 = require("./set-importance");
const set_provenance_1 = require("./set-provenance");
const get_provenance_1 = require("./get-provenance");
const split_1 = require("./split");
const synthesize_1 = require("./synthesize");
function registerNoteExtGroup(program) {
    (0, _register_group_1.registerGroup)(program, "note-ext", [
        suggest_tags_1.suggestTagsAction,
        suggest_tags_links_1.suggestTagsLinksAction,
        set_importance_1.setImportanceAction,
        set_provenance_1.setProvenanceAction,
        get_provenance_1.getProvenanceAction,
        split_1.splitNoteAction,
        synthesize_1.synthesizeAction,
    ]);
}
