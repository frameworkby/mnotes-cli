"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRecipeGroup = registerRecipeGroup;
const _register_group_1 = require("../_register-group");
const list_1 = require("./list");
const run_1 = require("./run");
function registerRecipeGroup(program) {
    (0, _register_group_1.registerGroup)(program, "recipe", [list_1.listRecipesAction, run_1.runRecipeAction]);
}
