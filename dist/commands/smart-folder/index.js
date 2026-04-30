"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSmartFolderGroup = registerSmartFolderGroup;
const _register_group_1 = require("../_register-group");
const list_1 = require("./list");
const create_1 = require("./create");
const delete_1 = require("./delete");
function registerSmartFolderGroup(program) {
    (0, _register_group_1.registerGroup)(program, "smart-folder", [
        list_1.listSmartFoldersAction,
        create_1.createSmartFolderAction,
        delete_1.deleteSmartFolderAction,
    ]);
}
