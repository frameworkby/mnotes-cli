"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTaskGroup = registerTaskGroup;
const _register_group_1 = require("../_register-group");
const list_1 = require("./list");
const toggle_1 = require("./toggle");
function registerTaskGroup(program) {
    (0, _register_group_1.registerGroup)(program, "task", [list_1.listTasksAction, toggle_1.toggleTaskAction]);
}
