"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSessionGroup = registerSessionGroup;
const _register_group_1 = require("../_register-group");
const list_1 = require("./list");
const log_1 = require("./log");
const replay_1 = require("./replay");
const resume_1 = require("./resume");
const save_conversation_1 = require("./save-conversation");
function registerSessionGroup(program) {
    (0, _register_group_1.registerGroup)(program, "session", [
        list_1.listSessionsAction,
        log_1.sessionLogAction,
        replay_1.sessionReplayAction,
        resume_1.sessionResumeAction,
        save_conversation_1.saveConversationAction,
    ]);
}
