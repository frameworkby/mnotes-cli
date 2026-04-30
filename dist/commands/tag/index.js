"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTagGroup = registerTagGroup;
const _register_group_1 = require("../_register-group");
const list_1 = require("./list");
const manage_1 = require("./manage");
const extract_1 = require("./extract");
function registerTagGroup(program) {
    (0, _register_group_1.registerGroup)(program, "tag", [
        list_1.listTagsAction,
        manage_1.manageTagsAction,
        extract_1.extractEntitiesAction,
    ]);
}
