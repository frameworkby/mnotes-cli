"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTimelineGroup = registerTimelineGroup;
const _register_group_1 = require("../_register-group");
const list_1 = require("./list");
function registerTimelineGroup(program) {
    (0, _register_group_1.registerGroup)(program, "timeline", [list_1.listTimelineAction]);
}
