"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGraphGroup = registerGraphGroup;
const _register_group_1 = require("../_register-group");
const get_1 = require("./get");
const neighbors_1 = require("./neighbors");
const traverse_1 = require("./traverse");
const find_path_1 = require("./find-path");
const query_1 = require("./query");
const query_note_1 = require("./query-note");
const populate_1 = require("./populate");
const related_1 = require("./related");
const backlinks_1 = require("./backlinks");
const links_1 = require("./links");
const create_node_1 = require("./create-node");
const delete_node_1 = require("./delete-node");
const create_edge_1 = require("./create-edge");
const delete_edge_1 = require("./delete-edge");
function registerGraphGroup(program) {
    (0, _register_group_1.registerGroup)(program, "graph", [
        get_1.getGraphAction,
        neighbors_1.neighborsAction,
        traverse_1.traverseAction,
        find_path_1.findPathAction,
        query_1.queryGraphAction,
        query_note_1.queryNoteGraphAction,
        populate_1.populateGraphAction,
        related_1.relatedNotesAction,
        backlinks_1.backlinksAction,
        links_1.noteLinksAction,
        create_node_1.createNodeAction,
        delete_node_1.deleteNodeAction,
        create_edge_1.createEdgeAction,
        delete_edge_1.deleteEdgeAction,
    ]);
}
