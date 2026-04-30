"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMocGroup = registerMocGroup;
const _register_group_1 = require("../_register-group");
const generate_1 = require("./generate");
function registerMocGroup(program) {
    (0, _register_group_1.registerGroup)(program, "moc", [generate_1.generateMocAction]);
}
