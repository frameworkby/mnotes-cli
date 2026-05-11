import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { bulkArchiveAction } from "./archive";
import { bulkDeleteAction } from "./delete";
import { bulkMoveAction } from "./move";
import { bulkTagAction } from "./tag";
import { bulkKnowledgeRecallAction } from "./knowledge-recall";

export function registerBulkGroup(program: Command): void {
  registerGroup(program, "bulk", [
    bulkArchiveAction,
    bulkDeleteAction,
    bulkMoveAction,
    bulkTagAction,
    bulkKnowledgeRecallAction,
  ]);
}
