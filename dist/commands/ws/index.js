"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWsGroup = registerWsGroup;
const _register_group_1 = require("../_register-group");
const context_1 = require("./context");
const role_1 = require("./role");
const update_1 = require("./update");
const delete_1 = require("./delete");
const setup_1 = require("./setup");
const team_1 = require("./team");
function registerWsGroup(program) {
    (0, _register_group_1.registerGroup)(program, "ws", [
        context_1.contextAction,
        role_1.roleAction,
        update_1.updateWsAction,
        delete_1.deleteWsAction,
        setup_1.setupWsAction,
        team_1.teamAction,
    ]);
}
