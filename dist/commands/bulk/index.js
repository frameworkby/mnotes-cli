"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBulkGroup = registerBulkGroup;
const _register_group_1 = require("../_register-group");
const archive_1 = require("./archive");
const delete_1 = require("./delete");
const move_1 = require("./move");
const tag_1 = require("./tag");
const knowledge_recall_1 = require("./knowledge-recall");
function registerBulkGroup(program) {
    (0, _register_group_1.registerGroup)(program, "bulk", [
        archive_1.bulkArchiveAction,
        delete_1.bulkDeleteAction,
        move_1.bulkMoveAction,
        tag_1.bulkTagAction,
        knowledge_recall_1.bulkKnowledgeRecallAction,
    ]);
}
