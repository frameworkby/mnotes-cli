"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFileGroup = registerFileGroup;
const _register_group_1 = require("../_register-group");
const upload_1 = require("./upload");
function registerFileGroup(program) {
    (0, _register_group_1.registerGroup)(program, "file", [upload_1.uploadFileAction]);
}
