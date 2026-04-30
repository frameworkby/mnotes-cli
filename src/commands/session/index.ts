import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { listSessionsAction } from "./list";
import { sessionLogAction } from "./log";
import { sessionReplayAction } from "./replay";
import { sessionResumeAction } from "./resume";
import { saveConversationAction } from "./save-conversation";

export function registerSessionGroup(program: Command): void {
  registerGroup(program, "session", [
    listSessionsAction,
    sessionLogAction,
    sessionReplayAction,
    sessionResumeAction,
    saveConversationAction,
  ]);
}
