"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFolderGroup = registerFolderGroup;
const _register_group_1 = require("../_register-group");
const list_1 = require("./list");
const summary_1 = require("./summary");
const manage_1 = require("./manage");
const recent_1 = require("./recent");
const search_tags_1 = require("./search-tags");
const move_1 = require("./move");
const delete_empty_1 = require("./delete-empty");
function registerFolderGroup(program) {
    (0, _register_group_1.registerGroup)(program, "folder", [
        list_1.listFoldersAction,
        summary_1.folderSummaryAction,
        manage_1.manageFoldersAction,
        recent_1.folderRecentAction,
        search_tags_1.folderSearchTagsAction,
        move_1.moveFolderAction,
        delete_empty_1.deleteEmptyFoldersAction,
    ]);
}
