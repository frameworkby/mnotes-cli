"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInfoGroup = registerInfoGroup;
const _register_group_1 = require("../_register-group");
const version_1 = require("./version");
const instructions_1 = require("./instructions");
function registerInfoGroup(program) {
    (0, _register_group_1.registerGroup)(program, "info", [version_1.versionAction, instructions_1.instructionsAction]);
}
