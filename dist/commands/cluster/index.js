"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerClusterGroup = registerClusterGroup;
const _register_group_1 = require("../_register-group");
const get_1 = require("./get");
function registerClusterGroup(program) {
    (0, _register_group_1.registerGroup)(program, "cluster", [get_1.getClustersAction]);
}
