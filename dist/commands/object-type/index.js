"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerObjectTypeGroup = registerObjectTypeGroup;
const _register_group_1 = require("../_register-group");
const list_1 = require("./list");
const query_1 = require("./query");
function registerObjectTypeGroup(program) {
    (0, _register_group_1.registerGroup)(program, "object-type", [
        list_1.listObjectTypesAction,
        query_1.queryByTypeAction,
    ]);
}
