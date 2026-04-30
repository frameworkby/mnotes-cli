"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNoteGroup = registerNoteGroup;
const _register_group_1 = require("../_register-group");
const list_1 = require("./list");
const create_1 = require("./create");
const get_1 = require("./get");
const update_1 = require("./update");
const delete_1 = require("./delete");
const search_1 = require("./search");
function registerNoteGroup(program) {
    (0, _register_group_1.registerGroup)(program, "note", [
        list_1.listAction,
        create_1.createNoteAction,
        get_1.getNoteAction,
        update_1.updateNoteAction,
        delete_1.deleteNoteAction,
        search_1.searchNotesAction,
    ]);
}
