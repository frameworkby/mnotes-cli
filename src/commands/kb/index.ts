import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { recallAction } from "./recall";
import { storeAction } from "./store";
import { memoryAction } from "./memory";
import { ingestAction } from "./ingest";
import { decayAction } from "./decay";
import { archiveAction } from "./archive";
import { consolidateAction } from "./consolidate";
import { snapshotAction } from "./snapshot";
import { askAction } from "./ask";
import { linkAction } from "./link";
import { scanConflictsAction } from "./scan-conflicts";
import { conflictsAction } from "./conflicts";
import { statsAction } from "./stats";

export function registerKbGroup(program: Command): void {
  registerGroup(program, "kb", [
    recallAction,
    storeAction,
    memoryAction,
    ingestAction,
    decayAction,
    archiveAction,
    consolidateAction,
    snapshotAction,
    askAction,
    linkAction,
    scanConflictsAction,
    conflictsAction,
    statsAction,
  ]);
}
