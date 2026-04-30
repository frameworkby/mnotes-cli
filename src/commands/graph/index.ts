import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { getGraphAction } from "./get";
import { neighborsAction } from "./neighbors";
import { traverseAction } from "./traverse";
import { findPathAction } from "./find-path";
import { queryGraphAction } from "./query";
import { queryNoteGraphAction } from "./query-note";
import { populateGraphAction } from "./populate";
import { relatedNotesAction } from "./related";
import { backlinksAction } from "./backlinks";
import { noteLinksAction } from "./links";
import { createNodeAction } from "./create-node";
import { deleteNodeAction } from "./delete-node";
import { createEdgeAction } from "./create-edge";
import { deleteEdgeAction } from "./delete-edge";

export function registerGraphGroup(program: Command): void {
  registerGroup(program, "graph", [
    getGraphAction,
    neighborsAction,
    traverseAction,
    findPathAction,
    queryGraphAction,
    queryNoteGraphAction,
    populateGraphAction,
    relatedNotesAction,
    backlinksAction,
    noteLinksAction,
    createNodeAction,
    deleteNodeAction,
    createEdgeAction,
    deleteEdgeAction,
  ]);
}
