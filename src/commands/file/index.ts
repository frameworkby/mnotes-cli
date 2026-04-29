import type { Command } from "commander";
import { registerGroup } from "../_register-group";
import { uploadFileAction } from "./upload";

export function registerFileGroup(program: Command): void {
  registerGroup(program, "file", [uploadFileAction]);
}
