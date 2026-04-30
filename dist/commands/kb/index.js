"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerKbGroup = registerKbGroup;
const _register_group_1 = require("../_register-group");
const recall_1 = require("./recall");
const store_1 = require("./store");
const memory_1 = require("./memory");
const ingest_1 = require("./ingest");
const decay_1 = require("./decay");
const archive_1 = require("./archive");
const consolidate_1 = require("./consolidate");
const snapshot_1 = require("./snapshot");
const ask_1 = require("./ask");
const link_1 = require("./link");
const scan_conflicts_1 = require("./scan-conflicts");
const conflicts_1 = require("./conflicts");
const stats_1 = require("./stats");
function registerKbGroup(program) {
    (0, _register_group_1.registerGroup)(program, "kb", [
        recall_1.recallAction,
        store_1.storeAction,
        memory_1.memoryAction,
        ingest_1.ingestAction,
        decay_1.decayAction,
        archive_1.archiveAction,
        consolidate_1.consolidateAction,
        snapshot_1.snapshotAction,
        ask_1.askAction,
        link_1.linkAction,
        scan_conflicts_1.scanConflictsAction,
        conflicts_1.conflictsAction,
        stats_1.statsAction,
    ]);
}
