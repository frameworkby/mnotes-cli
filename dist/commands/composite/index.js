"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCompositeGroup = registerCompositeGroup;
const _register_group_1 = require("../_register-group");
const context_fetch_1 = require("./context-fetch");
const project_load_1 = require("./project-load");
function registerCompositeGroup(program) {
    (0, _register_group_1.registerGroup)(program, "composite", [context_fetch_1.contextFetchAction, project_load_1.projectLoadAction]);
}
